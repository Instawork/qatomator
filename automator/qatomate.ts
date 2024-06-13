import { initialiseExtensionAndEnterPrompt, setupDriver } from './setupHelpers'
import { config } from './config'

const navigateAndQatomate = async () => {
    const driver = await setupDriver()
    try {
        await driver.get(config.targetEnvUrl)
        await initialiseExtensionAndEnterPrompt(
            driver,
            'You are to login with username: Matthew2052Owensb353WebCompany@instawork.com and password test123 and book a shift for next week via "Book Instawork Pros"',
        )

        // Capture screenshots
        // const screenshot1 = await driver.takeScreenshot()
        // fs.writeFileSync(`${config.artifactsDir}/starting-run.png`, screenshot1, 'base64')
        await driver.sleep(120000) // Wait for signal from extension to end run
        // let screenshot2 = await driver.takeScreenshot()
        // fs.writeFileSync('reports/ending-run-soon.png', screenshot2, 'base64')
        // await driver.sleep(10000)

        // const logs: string[] = await driver.executeScript(() => {
        //     return new Promise((resolve) => {
        //         chrome.storage.local.get('logs', (result) => {
        //             resolve(result.logs)
        //         })
        //     })
        // })
        // fs.writeFileSync(
        //     `${config.downloadsDir}/extension-logs-headless.txt`,
        //     logs.join('\n'),
        //     'utf-8',
        // )
    } finally {
        await driver.quit()
    }
}

navigateAndQatomate()
