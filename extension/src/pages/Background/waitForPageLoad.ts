export const waitForPageLoad = async (tabId: number, timeout = 30000) => {
    return new Promise<void>((resolve, reject) => {
        const onCompleted = (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
            if (details.tabId === tabId) {
                cleanup()
                resolve()
            }
        }
        const onErrorOccurred = (
            details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
        ) => {
            if (details.tabId === tabId) {
                cleanup()
                reject(new Error('Page load error occurred'))
            }
        }
        const checkTabStatus = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    cleanup()
                    reject(new Error(chrome.runtime.lastError.message))
                    return
                }
                if (tab.status === 'complete') {
                    cleanup()
                    resolve()
                }
            })
        }
        checkTabStatus()

        const cleanup = () => {
            clearTimeout(timeoutId)
            chrome.webNavigation.onCompleted.removeListener(onCompleted)
            chrome.webNavigation.onErrorOccurred.removeListener(onErrorOccurred)
        }

        const timeoutId = setTimeout(() => {
            cleanup()
            reject(new Error('Page load timed out'))
        }, timeout)

        chrome.webNavigation.onCompleted.addListener(onCompleted)
        chrome.webNavigation.onErrorOccurred.addListener(onErrorOccurred)
    })
}
