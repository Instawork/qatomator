import { contentScripts } from '../../constants'

chrome.runtime.onMessage.addListener((message, sender, sendResponse): true | undefined => {
    const { type, payload } = message
    if (type in contentScripts) {
        // @ts-expect-error Payload is an array
        const resp = contentScripts[type](...payload)
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
