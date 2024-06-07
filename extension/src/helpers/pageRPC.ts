import getAnnotatedDOM, { getUniqueElementSelectorId } from '../pages/Content/getAnnotatedDOM'
import { copyToClipboard } from '../pages/Content/copyToClipboard'
import ripple from '../pages/Content/ripple'
import { sleep } from './utils'

export const rpcMethods = {
    getAnnotatedDOM,
    getUniqueElementSelectorId,
    ripple,
    copyToClipboard,
} as const

export type RPCMethods = typeof rpcMethods
type MethodName = keyof RPCMethods
type Payload<T extends MethodName> = Parameters<RPCMethods[T]>
type MethodRT<T extends MethodName> = ReturnType<RPCMethods[T]>

// Call this function from the content script
export const callRPC = async <T extends MethodName>(
    type: keyof typeof rpcMethods,
    payload?: Payload<T>,
    maxTries = 1,
): Promise<MethodRT<T>> => {
    const URL_PARAMS = new URLSearchParams(window.location.search)
    let queryOptions: object = { active: true, currentWindow: true }
    if (URL_PARAMS.has('tab')) {
        queryOptions = { index: parseInt(<string>URL_PARAMS.get('tab')) }
    }
    const activeTab = (await chrome.tabs.query(queryOptions))[0]
    if (!activeTab?.id) throw new Error('No active tab found')
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let err: any
    for (let i = 0; i < maxTries; i++) {
        try {
            const response = await chrome.tabs.sendMessage(activeTab.id, {
                type,
                payload: payload || [],
            })
            return response
        } catch (e) {
            console.log(e)
            if (i === maxTries - 1) {
                // Last try, throw the error
                err = e
            } else {
                // Content script may not have loaded, retry
                await sleep(2000)
            }
        }
    }
    throw err
}

const isKnownMethodName = (type: string): type is MethodName => {
    return type in rpcMethods
}

// This function should run in the content script
export const watchForRPCRequests = () => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse): true | undefined => {
        const type = message.type
        if (isKnownMethodName(type)) {
            // @ts-expect-error we need to type payload
            const resp = rpcMethods[type](...message.payload)
            if (resp instanceof Promise) {
                resp.then((resolvedResp) => {
                    sendResponse(resolvedResp)
                })

                return true
            } else {
                sendResponse(resp)
            }
        }
    })
}
