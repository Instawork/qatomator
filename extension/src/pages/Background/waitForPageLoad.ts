export const waitForPageLoad = async (tabId: number, timeout = 30000) => {
    return new Promise<void>((resolve, reject) => {
        const activeRequests = new Set<string>()
        const incrementReq = (details: chrome.webRequest.WebRequestBodyDetails) => {
            if (details.tabId === tabId) {
                activeRequests.add(details.requestId)
            }
        }
        const decrementReq = (details: chrome.webRequest.WebResponseCacheDetails) => {
            if (details.tabId === tabId) {
                activeRequests.delete(details.requestId)
            }
        }
        const checkTabStatus = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    cleanup()
                    reject(new Error(chrome.runtime.lastError.message))
                    return
                }
                if (tab.status === 'complete' && activeRequests.size === 0) {
                    cleanup()
                    resolve()
                }
            })
        }
        const cleanup = () => {
            clearTimeout(timeoutId)
            clearInterval(intervalId)
            chrome.webRequest.onBeforeRequest.removeListener(incrementReq)
            chrome.webRequest.onCompleted.removeListener(decrementReq)
            chrome.webRequest.onErrorOccurred.removeListener(decrementReq)
        }

        const timeoutId = setTimeout(() => {
            console.log(`Page did not completely load in ${timeout}. Proceeding regardless.`)
            cleanup()
            resolve()
        }, timeout)

        const intervalId = setInterval(checkTabStatus, 1000) // Check tab status every second

        chrome.webRequest.onBeforeRequest.addListener(incrementReq, {
            urls: ['<all_urls>'],
            tabId,
        })
        chrome.webRequest.onCompleted.addListener(decrementReq, {
            urls: ['<all_urls>'],
            tabId,
        })
        chrome.webRequest.onErrorOccurred.addListener(decrementReq, {
            urls: ['<all_urls>'],
            tabId,
        })
    })
}
