/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { CreateCompletionResponseUsage } from 'openai'
import { attachDebugger, detachDebugger } from '../helpers/chromeDebugger'
import { disableIncompatibleExtensions, reenableExtensions } from '../helpers/chromeManagement'
import { callDOMAction } from '../helpers/domActions'
import { ParsedResponse, ParsedResponseSuccess, parseResponse } from '../helpers/parseResponse'
import { determineNextAction } from '../helpers/determineNextAction'
import templatize from '../helpers/templatize'
import { getSimplifiedDom } from '../helpers/simplifyDom'
import { truthyFilter } from '../helpers/utils'
import { MyStateCreator, useAppState } from './store'
import { takeScreenshot } from '../helpers/takeScreenshot'
import { downloadAsFile } from '../helpers/downloader'
import { getActiveOrTargetTab } from '../helpers/chromeTabs'

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
            const shouldDownloadProgress = useAppState.getState().settings.downloadProgress
            const wasStopped = () => get().currentTask.status !== 'running'
            const setActionStatus = (status: CurrentTaskSlice['actionStatus']) => {
                set((state) => {
                    state.currentTask.actionStatus = status
                })
            }
            const instructions = get().ui.actions.getInstructions()

            set((state) => {
                state.currentTask.instructions = instructions
                state.currentTask.status = 'running'
                state.currentTask.actionStatus = 'attaching-debugger'
            })

            try {
                const activeTab = await getActiveOrTargetTab()
                const tabId = activeTab.id!
                set((state) => {
                    state.currentTask.tabId = tabId
                })

                await attachDebugger(tabId)
                await disableIncompatibleExtensions()

                // todo: Maybe make this limit configurable
                while (get().currentTask.history.length < 50) {
                    if (wasStopped()) break

                    setActionStatus('pulling-dom')
                    const pageDOM = await getSimplifiedDom()
                    if (!pageDOM) {
                        set((state) => {
                            state.currentTask.status = 'error'
                        })
                        break
                    }
                    const html = pageDOM.outerHTML

                    if (wasStopped()) break

                    setActionStatus('transforming-dom')
                    const currentDom = templatize(html)

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
                        set((state) => {
                            state.currentTask.status = 'error'
                        })
                        break
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
                        break
                    }

                    if (shouldDownloadProgress) {
                        await takeScreenshot(get().currentTask.history.length)
                        await downloadAsFile(
                            JSON.stringify(get().currentTask),
                            `step-${get().currentTask.history.length}`,
                        )
                    }

                    if (
                        action === null ||
                        action.parsedAction.name === 'finish' ||
                        action.parsedAction.name === 'fail'
                    ) {
                        break
                    }

                    if (action.parsedAction.name === 'click') {
                        await callDOMAction('click', action.parsedAction.args)
                    } else if (action.parsedAction.name === 'setValue') {
                        await callDOMAction(action?.parsedAction.name, action?.parsedAction.args)
                    }

                    if (wasStopped()) break

                    setActionStatus('waiting')
                    const waitForPageLoad = (timeout: number = 10000): Promise<void> => {
                        return new Promise<void>((resolve) => {
                            const checkReadyState = () => {
                                if (document.readyState === 'complete') {
                                    resolve()
                                } else {
                                    window.addEventListener('load', handleLoad, { once: true })
                                }
                            }

                            const timeoutId = setTimeout(() => {
                                window.removeEventListener('load', handleLoad)
                                resolve()
                            }, timeout)

                            const handleLoad = () => {
                                clearTimeout(timeoutId)
                                resolve()
                            }

                            checkReadyState()
                        })
                    }

                    const executeScript = async (func: Function, args: any[]): Promise<any> => {
                        const [result] = await chrome.scripting.executeScript({
                            target: { tabId },
                            // @ts-expect-error
                            func,
                            args,
                        })
                        return result.result
                    }
                    await executeScript(waitForPageLoad, [])
                }
                set((state) => {
                    state.currentTask.status = 'success'
                })
            } catch (e) {
                onError((e as Error).message)
                set((state) => {
                    state.currentTask.status = 'error'
                })
            } finally {
                await detachDebugger(get().currentTask.tabId)
                await reenableExtensions()
                await downloadAsFile(JSON.stringify(get().currentTask), 'TERMINATE_ME.json')
            }
        },
        interrupt: () => {
            set((state) => {
                state.currentTask.status = 'interrupted'
            })
        },
    },
})
