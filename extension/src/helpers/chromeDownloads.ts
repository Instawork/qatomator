/* eslint-disable @typescript-eslint/no-explicit-any */
export const downloadAsFile = async (content: any, filename: string) => {
    // await chrome.downloads.download({
    //     url: blobUrl,
    //     filename: `step-${step}.png`,
    // })
    // workaround since the above does not seem to respect filename params, a known issue
    let blob: Blob
    try {
        if (filename.includes('.json')) {
            blob = new Blob([content], { type: 'application/json' })
        } else {
            const dataUrl = content.toDataURL('image/png')
            blob = await (await fetch(dataUrl)).blob()
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    } catch (e) {
        console.error(`Error downloading file: ${e}`)
        throw e
    }
}
