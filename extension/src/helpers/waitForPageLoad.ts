export const waitForPageLoad = async (timeout = 10000) => {
    return new Promise<void>((resolve, reject) => {
        if (document.readyState === 'complete') {
            resolve()
            return
        }

        const interval = setInterval(async () => {
            if (document.readyState === 'complete') {
                clearInterval(interval)
                clearTimeout(timeoutId)
                resolve()
            }
        }, 500)

        const timeoutId = setTimeout(() => {
            clearInterval(interval)
            reject(new Error('Page load timed out'))
        }, timeout)
    })
}
