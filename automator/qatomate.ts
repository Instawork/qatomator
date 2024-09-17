import { initialiseExtensionAndEnterPrompt, setupDriver, trackExtensionLogs } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import fs from 'fs'
import { defaultPrompt } from './promptLibrary/prompts'
import { WebDriver } from 'selenium-webdriver'
const prompt = defaultPrompt
let driver: WebDriver

const navigateAndQatomate = async (prompt: string) => {
    try {
        driver = await setupDriver()
        await driver.get(config.targetEnvUrl) // Todo: expand to different entrypoints
        await initialiseExtensionAndEnterPrompt(driver, prompt)
        if (!config.isCI) {
            await trackExtensionLogs(driver)
        }

        fs.watch(config.downloadsDir, async (eventType, filename) => {
            if (filename === 'TERMINATE_ME.json') {
                logger.info('Received TERMINATE_ME.json. Stopping run')
                await driver.quit()
                process.exit(0)
            }
        })
        setTimeout(async () => {
            logger.info('Timeout reached. Stopping run')
            await driver.quit()
            process.exit(0)
        }, config.maxTimeout)
    } catch (e) {
        logger.info('Error occurred', e)
        if (driver) {
            await driver.quit()
        }
        process.exit(1)
    }
}

navigateAndQatomate(prompt)
