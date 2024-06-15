import { initialiseExtensionAndEnterPrompt, setupDriver } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import { signals } from './signals'
import fs from 'fs'

const prompt =
    'You are to login with username: Allie_Weber@hotmail.com and password 12345. ' +
    'Then book a shift for next week via "Book Instawork Pros"'

const navigateAndQatomate = async (prompt: string) => {
    try {
        const driver = await setupDriver()
        await driver.get(config.targetEnvUrl)
        await initialiseExtensionAndEnterPrompt(driver, prompt)
        // await trackExtensionLogs(driver)

        const checkTerminate = () => {
            const files = fs.readdirSync(config.downloadsDir)
            console.log(files)
            if (files.includes('TERMINATE_ME.json')) {
                driver.quit()
                process.exit(0)
            }
        }
        setInterval(checkTerminate, 5000)
        // const windows = await driver.getAllWindowHandles()
        // await driver.switchTo().window(windows[1])
        // const logs: string[] = await driver.executeScript(() => {
        //     return new Promise((resolve) => {
        //         console.log(JSON.stringify(chrome.storage))
        //         chrome.storage.session.get(null, (result) => {
        //             resolve(result.logs)
        //         })
        //     })
        // })
        // console.log(logs)
        // fs.writeFileSync('reports/extension-logs-headless.txt', logs.join('\n'), 'utf-8')

        // while (signals.keepAlive) {
        //     await driver.sleep(1000)
        // }
        // if (!signals.keepAlive) {
        //     await driver.quit()
        //     process.exit(0)
        // }
        setTimeout(async () => {
            logger.info('Timeout reached. Stopping run')
            signals.keepAlive = false
        }, config.maxTimeout)
    } catch (e) {
        logger.info('Error occurred', e)
        process.exit(1)
    }
}

navigateAndQatomate(prompt)
