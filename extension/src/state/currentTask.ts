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
import { readStorageLogger, storageLogger } from '../helpers/chromeStorage'

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
            const downloadProgress = useAppState.getState().settings.downloadProgress
            const wasStopped = () => get().currentTask.status !== 'running'
            const setActionStatus = (status: CurrentTaskSlice['actionStatus']) => {
                set((state) => {
                    state.currentTask.actionStatus = status
                })
            }

            const instructions = get().ui.instructions

            if (!instructions || get().currentTask.status === 'running') return

            set((state) => {
                state.currentTask.instructions = instructions
                state.currentTask.history = []
                state.currentTask.status = 'running'
                state.currentTask.actionStatus = 'attaching-debugger'
            })

            try {
                const URL_PARAMS = new URLSearchParams(window.location.search)
                let queryOptions: object = { active: true, currentWindow: true }
                if (URL_PARAMS.has('tab')) {
                    queryOptions = { index: parseInt(<string>URL_PARAMS.get('tab')) }
                }
                const activeTab = (await chrome.tabs.query(queryOptions))[0]
                if (!activeTab.id) throw new Error('No active tab found')

                const tabId = activeTab.id
                set((state) => {
                    state.currentTask.tabId = tabId
                })

                storageLogger('Adding debugger and disabling extensions')
                await attachDebugger(tabId)
                await disableIncompatibleExtensions()
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    if (wasStopped()) break

                    storageLogger('pulling dom')
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
                    storageLogger('transforming dom')
                    setActionStatus('transforming-dom')
                    const currentDom = templatize(html)

                    const previousActions = get()
                        .currentTask.history.map((entry) => entry.action)
                        .filter(truthyFilter)

                    storageLogger('performing query')
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

                    storageLogger('performing action')
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

                    if (downloadProgress) {
                        try {
                            await takeScreenshot(tabId, get().currentTask.history.length)
                            const key = `step-${get().currentTask.history.length}`
                            const blob = new Blob([JSON.stringify(get().currentTask)], {
                                type: 'application/json',
                            })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${key}.json`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                        } catch (e) {
                            console.error(e)
                        }
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

                    storageLogger(JSON.stringify(get().currentTask))

                    if (wasStopped()) break

                    // While testing let's automatically stop after 50 actions to avoid
                    // infinite loops
                    if (get().currentTask.history.length >= 50) {
                        break
                    }

                    setActionStatus('waiting')
                    // // todo: sleep 2 seconds. This is pretty arbitrary; we should figure out a better way to determine when the page has settled.
                    // await sleep(5000) // booking form page seems to take awhile...

                    const waitForPageLoad = (timeout: number = 60000): Promise<void> => {
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
                await readStorageLogger()
            }
        },
        interrupt: () => {
            set((state) => {
                state.currentTask.status = 'interrupted'
            })
        },
    },
})
