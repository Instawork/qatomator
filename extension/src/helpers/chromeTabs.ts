export const getActiveOrTargetTab = async () => {
    const URL_PARAMS = new URLSearchParams(window.location.search)
    let queryOptions: object = { active: true, currentWindow: true }
    if (URL_PARAMS.has('tab')) {
        queryOptions = { index: parseInt(<string>URL_PARAMS.get('tab')) }
    }
    const activeTab = (await chrome.tabs.query(queryOptions))[0]
    if (!activeTab.id) throw new Error('No active tab found')
    return activeTab
}
