import { storageLogger } from './chromeStorage'

export function attachDebugger(tabId: number) {
    return new Promise<void>((resolve, reject) => {
        try {
            chrome.debugger.attach({ tabId }, '1.2', async () => {
                if (chrome.runtime.lastError) {
                    storageLogger(
                        `'Failed to attach debugger:', ${chrome.runtime.lastError.message}`,
                    )
                    reject(
                        new Error(`Failed to attach debugger: ${chrome.runtime.lastError.message}`),
                    )
                } else {
                    storageLogger('attached to debugger')
                    await chrome.debugger.sendCommand({ tabId }, 'DOM.enable')
                    storageLogger('DOM enabled')
                    await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable')
                    storageLogger('Runtime enabled')
                    resolve()
                }
            })
        } catch (e) {
            reject(e)
        }
    })
}

export async function detachDebugger(tabId: number) {
    const targets = await chrome.debugger.getTargets()
    const isAttached = targets.some((target) => target.tabId === tabId && target.attached)
    if (isAttached) {
        chrome.debugger.detach({ tabId: tabId })
    }
}
