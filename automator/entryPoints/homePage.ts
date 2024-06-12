import { initialiseExtensionAndEnterPrompt, setupDriver } from './initHelpers'
import fs from 'fs'
import { config } from '../config'

const navigateAndQatomate = async () => {
    const driver = await setupDriver()
    try {
        await driver.get('https://qa.instawork.com') // Replace with the actual home page URL
        await driver.sleep(5000) // Give some time for extension to load. todo: Make it query & check instead
        await initialiseExtensionAndEnterPrompt(
            driver,
            'You are to login with username: Matthew2052Owensb353WebCompany@instawork.com and password test123 and book a shift for next week via "Book Instawork Pros"',
        )

        // Capture screenshots
        const screenshot1 = await driver.takeScreenshot()
        fs.writeFileSync(`${config.downloadsDir}/starting-run.png`, screenshot1, 'base64')
        await driver.sleep(30000)
        // let screenshot2 = await driver.takeScreenshot()
        // fs.writeFileSync('reports/ending-run-soon.png', screenshot2, 'base64')
        // await driver.sleep(10000)

        const windows = await driver.getAllWindowHandles()
        await driver.switchTo().window(windows[1])
        const stepScreenshot = await driver.takeScreenshot()
        fs.writeFileSync(`${config.downloadsDir}/extension-ss2.png`, stepScreenshot, 'base64')

        const logs = await driver.executeScript(() => {
            return new Promise((resolve) => {
                chrome.storage.local.get('logs', (result) => {
                    resolve(result.logs)
                })
            })
        })
        // console.log(logs)
        fs.writeFileSync(
            `${config.downloadsDir}/extension-logs-headless.txt`,
            logs.join('\n'),
            'utf-8',
        )
    } finally {
        await driver.quit()
    }
}

navigateAndQatomate()
