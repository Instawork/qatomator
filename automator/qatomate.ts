import { initialiseExtensionAndEnterPrompt, setupDriver, trackExtensionLogs } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import fs from 'fs'

const prompt =
    "You are a business partner on the Instawork platform. You are to login with username: jchu+partner@instawork.com and password 1234567890 first. Then, you need to book a General Labour Pro. Booking form has an entry point from 'Book New Shifts' button on the dashboard followed by 'Book new shift'.\n" +
    'When navigating the booking form, take note of the following which you may or may not be needed:\n' +
    '- The booking form has the following steps in order: Schedule, Staff, Hourly rate and Confirm.\n' +
    '- Click "Done" after you have selected your dates in the date picker\n' +
    'Consider your task finished on completing the booking. '

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
