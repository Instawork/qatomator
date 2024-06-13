import { storageLogger } from './chromeStorage'

const incompatibleExtensions = [
    'fdjamakpfbbddfjaooikfcpapjohcfmg', // Dashlane
    'hdokiejnpimakedhajhdlcegeplioahd', // LastPass
]

// Tracker for if we have multiple sessions running and have disabled the extension
// multiple times, we only want to re-enable it once all sessions have finished.
const disableCounts: Record<string, number> = {}

const _getExtensions = async () => {
    return new Promise<chrome.management.ExtensionInfo[]>((resolve, reject) => {
        chrome.management.getAll((extensions) => {
            if (chrome.runtime.lastError) {
                storageLogger(
                    `[Error] Failed to get extensions: ${chrome.runtime.lastError.message}`,
                )
                reject(chrome.runtime.lastError)
            } else {
                resolve(extensions.filter((extension) => extension.type === 'extension'))
            }
        })
    })
}
export const disableIncompatibleExtensions = async () => {
    const extensions = await _getExtensions()
    const targetExtensions = extensions.filter(
        (extension) => extension.enabled && incompatibleExtensions.includes(extension.id),
    )

    for (const extension of targetExtensions) {
        chrome.management.setEnabled(extension.id, false, () => {
            if (chrome.runtime.lastError) {
                storageLogger(
                    `[Error] Failed to disable extension ${extension.id}: ${chrome.runtime.lastError.message}`,
                )
            }
            disableCounts[extension.id] = (disableCounts[extension.id] || 0) + 1
        })
    }
}

export const reenableExtensions = async () => {
    const extensions = await _getExtensions()
    const targetExtensions = extensions.filter(
        (extension) => !extension.enabled && incompatibleExtensions.includes(extension.id),
    )

    for (const extension of targetExtensions) {
        if (disableCounts[extension.id] > 1) {
            disableCounts[extension.id] = disableCounts[extension.id] - 1
        } else if (disableCounts[extension.id] === 1) {
            await new Promise((resolve, reject) => {
                chrome.management.setEnabled(extension.id, true, () => {
                    if (chrome.runtime.lastError) {
                        storageLogger(
                            `Failed to enable extension ${extension.id}: ${chrome.runtime.lastError.message}`,
                        )
                        reject(chrome.runtime.lastError)
                    }
                    delete disableCounts[extension.id]
                    resolve(0)
                })
            })
        }
    }
}
