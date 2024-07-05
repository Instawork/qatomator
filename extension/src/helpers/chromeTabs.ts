import { rpcMethods } from '../constants'
import { useAppState } from '../state/store'
import { sleep } from './utils'

/*
To add
 */
export const getActiveOrTargetTabId = async () => {
    const URL_PARAMS = new URLSearchParams(window.location.search)
    let queryOptions: object = { active: true, currentWindow: true }
    if (URL_PARAMS.has('tab')) {
        queryOptions = { index: parseInt(<string>URL_PARAMS.get('tab')) }
    }
    const activeTab = (await chrome.tabs.query(queryOptions))[0]
    if (!activeTab.id) throw new Error('No active tab found')
    await chrome.tabs.update(activeTab.id, { active: true })
    return activeTab.id
}

export type RPCMethods = typeof rpcMethods
type MethodName = keyof RPCMethods
type Payload<T extends MethodName> = Parameters<RPCMethods[T]>
type MethodRT<T extends MethodName> = ReturnType<RPCMethods[T]>

/*
To add
 */
export const invokeScriptViaChromeTabs = async <T extends MethodName>(
    type: keyof typeof rpcMethods,
    payload?: Payload<T>,
    maxTries = 1,
): Promise<MethodRT<T>> => {
    const tabId = useAppState.getState().currentTask.tabId
    for (let i = 0; i < maxTries; i++) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, {
                type,
                payload: payload || [],
            })
            return response
        } catch (e) {
            console.error(e)
            if (i === maxTries - 1) {
                throw e
            } else {
                await sleep(1000)
            }
        }
    }
    throw Error('Something is horribly wrong if you see this')
}
