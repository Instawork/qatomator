/* eslint-disable @typescript-eslint/no-explicit-any */
export const downloadAsFile = async (content: any, filename: string) => {
    // await chrome.downloads.download({
    //     url: blobUrl,
    //     filename: `step-${step}.png`,
    // })
    // workaround since the above does not seem to respect filename params, a known issue
    const type = filename.includes('.json') ? 'application/json' : 'image/png'
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
