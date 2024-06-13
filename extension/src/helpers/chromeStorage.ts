import { config } from '../../../automator/config'

type storageKeys = 'logs' | 'addOthersInTheFutureHere'

export const storageLogger = (message: string | object, key: storageKeys = 'logs') => {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`

    chrome.storage.local.get({ [key]: [] }, (result) => {
        const logs = result[key] as string[]
        logs.push(logEntry)
        chrome.storage.local.set({ [key]: logs })
    })

    console.log(logEntry)
}

export const readStorageLogger = async (key: storageKeys = 'logs', download = true) => {
    return chrome.storage.local.get(key, (result) => {
        const logs = result[key] as string[]
        if (download) {
            const logsString = logs.join('\n')
            const blob = new Blob([logsString], {
                type: 'text/plain',
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${key}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }
        return logs
    })
}
