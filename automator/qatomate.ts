import { initialiseExtensionAndEnterPrompt, setupDriver, trackExtensionLogs } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import { signals } from './signals'

const prompt =
    'You are to login with username: Allie_Weber@hotmail.com and password 12345. ' +
    'Then book a shift for next week via "Book Instawork Pros"'

const navigateAndQatomate = async (prompt: string) => {
    try {
        const driver = await setupDriver()
        await driver.get(config.targetEnvUrl)
        await initialiseExtensionAndEnterPrompt(driver, prompt)
        await trackExtensionLogs(driver)

        while (signals.keepAlive) {
            await driver.sleep(1000)
        }
        if (!signals.keepAlive) {
            await driver.quit()
            process.exit(0)
        }
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
