export const waitForTabLoad = async (tabId: number, timeout = 30000) => {
    return new Promise<void>((resolve, reject) => {
        const checkTabStatus = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    clearInterval(interval)
                    clearTimeout(timeoutId)
                    reject(new Error(chrome.runtime.lastError.message))
                    return
                }
                if (tab.status === 'complete') {
                    clearInterval(interval)
                    clearTimeout(timeoutId)
                    resolve()
                }
            })
        }
        const interval = setInterval(checkTabStatus, 500)
        const timeoutId = setTimeout(() => {
            clearInterval(interval)
            reject(new Error('Page load timed out'))
        }, timeout)
    })
}
