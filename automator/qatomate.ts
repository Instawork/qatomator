import { initialiseExtensionAndEnterPrompt, setupDriver, trackExtensionLogs } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import fs from 'fs'

const prompt =
    'You are to login with username: by@instawork.com and password 1234. ' +
    'Then book a shift for next week via "Book Instawork Pros"'

const navigateAndQatomate = async (prompt: string) => {
    try {
        const driver = await setupDriver()
        await driver.get(config.targetEnvUrl) // Todo: expand to different entrypoints
        await initialiseExtensionAndEnterPrompt(driver, prompt)
        await trackExtensionLogs(driver)

        fs.watch(config.downloadsDir, (eventType, filename) => {
            if (filename === 'TERMINATE_ME.json') {
                logger.info('Received TERMINATE_ME.json. Stopping run')
                driver.quit()
                process.exit(0)
            }
        })
        setTimeout(async () => {
            logger.info('Timeout reached. Stopping run')
            process.exit(0)
        }, config.maxTimeout)
    } catch (e) {
        logger.info('Error occurred', e)
        process.exit(1)
    }
}

navigateAndQatomate(prompt)
