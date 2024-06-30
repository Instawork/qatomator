import { waitForPageLoad } from './waitForPageLoad'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'waitForTabLoad' && message.tabId) {
        waitForPageLoad(message.tabId)
            .then(() => sendResponse({ success: true }))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((error: { message: any }) =>
                sendResponse({ success: false, error: error.message }),
            )
        return true
    }
})
