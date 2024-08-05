// todo: check alternatives for following
/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { sleep } from './utils'
import { downloadAsFile } from './chromeDownloads'
import { useAppState } from '../state/store'

export const takeScreenshot = async (filename: string): Promise<void> => {
    try {
        const tabId = useAppState.getState().currentTask.tabId
        const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
                const img = new Image()
                img.onload = () => resolve(img)
                img.onerror = reject
                img.src = dataUrl
            })

        const executeScript = async (func: Function, args: any[]): Promise<any> => {
            const [result] = await chrome.scripting.executeScript({
                target: { tabId },
                // @ts-expect-error
                func,
                args,
            })
            return result.result
        }

        const scrollToPosition = (y: number) => {
            window.scrollTo(0, y)
            return window.innerHeight
        }

        const getDocumentHeight = () => {
            return document.body.scrollHeight
        }

        // Capture the initial visible part of the tab and load the image
        const initialDataUrl = await chrome.tabs.captureVisibleTab({
            format: 'png',
        })
        const initialImg = await loadImage(initialDataUrl)

        // Create a canvas to stitch the images together
        const canvas = document.createElement('canvas')
        canvas.width = initialImg.width
        // todo: This does not give the correct height in local and ci for some reason. To debug if there is a better way.
        const documentHeight = await executeScript(getDocumentHeight, [])
        canvas.height = documentHeight * 3
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')
        ctx.drawImage(initialImg, 0, 0, initialImg.width, initialImg.height)

        let currentScrollY = 0
        let stitchedHeight = initialImg.height

        while (currentScrollY < documentHeight) {
            currentScrollY += window.innerHeight
            await executeScript(scrollToPosition, [currentScrollY])
            await sleep(200)

            const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' })
            const img = await loadImage(dataUrl)

            ctx.drawImage(img, 0, stitchedHeight, img.width, img.height)
            stitchedHeight += img.height
        }

        await downloadAsFile(canvas, `${filename}.png`)
    } catch (error) {
        console.log(`Error taking screenshot:, ${error}`)
    }
}
