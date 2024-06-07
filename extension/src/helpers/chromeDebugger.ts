// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logMessage(message: any) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`

    chrome.storage.local.get({ logs: [] }, function (result) {
        const logs = result.logs
        logs.push(logEntry)
        chrome.storage.local.set({ logs: logs })
    })
    console.log(logEntry) // Also log to the console
}

export function attachDebugger(tabId: number) {
    return new Promise<void>((resolve, reject) => {
        try {
            chrome.debugger.attach({ tabId }, '1.2', async () => {
                if (chrome.runtime.lastError) {
                    logMessage(`'Failed to attach debugger:', ${chrome.runtime.lastError.message}`)
                    reject(
                        new Error(`Failed to attach debugger: ${chrome.runtime.lastError.message}`),
                    )
                } else {
                    logMessage('attached to debugger')
                    await chrome.debugger.sendCommand({ tabId }, 'DOM.enable')
                    logMessage('DOM enabled')
                    await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable')
                    logMessage('Runtime enabled')
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
