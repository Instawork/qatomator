/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { CreateCompletionResponseUsage } from 'openai'
import { attachDebugger, detachDebugger } from '../helpers/chromeDebugger'
import { disableIncompatibleExtensions, reenableExtensions } from '../helpers/chromeManagement'
import { callDOMAction } from '../helpers/domActions'
import { ParsedResponse, ParsedResponseSuccess, parseResponse } from '../helpers/parseResponse'
import { determineNextAction } from '../helpers/determineNextAction'
import { templatize } from '../helpers/templatize'
import { getSimplifiedDom } from '../helpers/simplifyDom'
import { truthyFilter } from '../helpers/utils'
import { MyStateCreator, useAppState } from './store'
import { takeScreenshot } from '../helpers/takeScreenshot'
import { downloadAsFile } from '../helpers/downloader'
import { getActiveOrTargetTabId } from '../helpers/chromeTabs'
import { clearStorageLogger, readStorageLogger, storageLogger } from '../helpers/chromeStorage'

export type TaskHistoryEntry = {
    prompt: string
    response: string
    action: ParsedResponse
    usage: CreateCompletionResponseUsage
}

export type CurrentTaskSlice = {
    tabId: number
    instructions: string | null
    history: TaskHistoryEntry[]
    status: 'idle' | 'running' | 'success' | 'error' | 'interrupted'
    actionStatus:
        | 'idle'
        | 'attaching-debugger'
        | 'pulling-dom'
        | 'transforming-dom'
        | 'performing-query'
        | 'performing-action'
        | 'waiting'
    actions: {
        runTask: (onError: (error: string) => void) => Promise<void>
        interrupt: () => void
    }
}
export const createCurrentTaskSlice: MyStateCreator<CurrentTaskSlice> = (set, get) => ({
    tabId: -1,
    instructions: null,
    history: [],
    status: 'idle',
    actionStatus: 'idle',
    actions: {
        runTask: async (onError) => {
            await clearStorageLogger()
            const shouldDownloadProgress = useAppState.getState().settings.downloadProgress
            const wasStopped = () => get().currentTask.status !== 'running'
            const setStatus = (status: CurrentTaskSlice['status']) => {
                set((state) => {
                    state.currentTask.status = status
                })
            }
            const setActionStatus = (status: CurrentTaskSlice['actionStatus']) => {
                storageLogger(`Action status: ${status}`)
                set((state) => {
                    state.currentTask.actionStatus = status
                })
            }
            const instructions = get().ui.actions.getInstructions()

            set((state) => {
                state.currentTask.instructions = instructions
                state.currentTask.history = []
                state.currentTask.status = 'running'
                state.currentTask.actionStatus = 'attaching-debugger'
            })

            try {
                const tabId = await getActiveOrTargetTabId()
                set((state) => {
                    state.currentTask.tabId = tabId
                })

                await attachDebugger(tabId)
                await disableIncompatibleExtensions()

                // todo: Maybe make this limit configurable
                while (get().currentTask.history.length < 50) {
                    setActionStatus('waiting')
                    // todo: Abstract this out and redo pageRPC to content and background itself
                    const sendMessagePromise = (message: any) => {
                        return new Promise((resolve, reject) => {
                            chrome.runtime.sendMessage(message, (response) => {
                                if (chrome.runtime.lastError) {
                                    reject(new Error(chrome.runtime.lastError.message))
                                } else if (response.success) {
                                    resolve(response)
                                } else {
                                    reject(new Error(response.error))
                                }
                            })
                        })
                    }
                    await sendMessagePromise({ action: 'waitForTabLoad', tabId })

                    setActionStatus('pulling-dom')
                    const pageDOM = await getSimplifiedDom()
                    // await storageLogger(JSON.stringify(pageDOM?.outerHTML))
                    if (!pageDOM) {
                        setStatus('error')
                        throw new Error('Failed to get DOM')
                    }
                    const html = pageDOM.outerHTML

                    if (wasStopped()) break

                    setActionStatus('transforming-dom')
                    const currentDom = await templatize(html)

                    const previousActions = get()
                        .currentTask.history.map((entry) => entry.action)
                        .filter(truthyFilter)

                    setActionStatus('performing-query')
                    const query = await determineNextAction(
                        instructions,
                        previousActions.filter((pa) => !('error' in pa)) as ParsedResponseSuccess[],
                        currentDom,
                        3,
                        onError,
                    )

                    if (!query) {
                        setStatus('error')
                        throw new Error(`Failed to determine next action}`)
                    }

                    if (wasStopped()) break

                    setActionStatus('performing-action')
                    const action = parseResponse(query.response)

                    set((state) => {
                        state.currentTask.history.push({
                            prompt: query.prompt,
                            response: query.response,
                            action,
                            usage: query.usage,
                        })
                    })
                    if ('error' in action) {
                        onError(action.error)
                        throw new Error(`Error when Performing Action: ${action.error}`)
                    }
                    if (shouldDownloadProgress) {
                        await takeScreenshot(get().currentTask.history.length)
                        await downloadAsFile(
                            JSON.stringify(get().currentTask),
                            `step-${get().currentTask.history.length}.json`,
                        )
                    }

                    if (
                        action === null ||
                        action.parsedAction.name === 'finish' ||
                        action.parsedAction.name === 'fail'
                    ) {
                        break
                    } else if (action.parsedAction.name === 'click') {
                        await callDOMAction('click', action.parsedAction.args)
                    } else if (action.parsedAction.name === 'setValue') {
                        await callDOMAction(action?.parsedAction.name, action?.parsedAction.args)
                    }

                    if (wasStopped()) break
                }
                setStatus('success')
            } catch (e) {
                onError((e as Error).message)
                storageLogger((e as Error).message)
                setStatus('error')
            } finally {
                await detachDebugger(get().currentTask.tabId)
                await reenableExtensions()
                await downloadAsFile(JSON.stringify(get().currentTask), 'TERMINATE_ME.json')
                // await readStorageLogger()
            }
        },
        interrupt: () => {
            set((state) => {
                state.currentTask.status = 'interrupted'
            })
        },
    },
})
