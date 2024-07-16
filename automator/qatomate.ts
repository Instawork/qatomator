import { initialiseExtensionAndEnterPrompt, setupDriver, trackExtensionLogs } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import fs from 'fs'

const prompt =
    "You are a business partner on the Instawork platform. You are to login with username: jchu+partner@instawork.com and password 1234567890 first. Then, you need to book a General Labour Pro. Booking form has an entry point from 'Book New Shifts' button on the dashboard followed by 'Book new shift'.\n" +
    'It is important to remember these while performing actions and navigating.' +
    'Handle Error States - If any errors are indicated, and cannot navigate to next step, resolve them by providing the correct inputs.' +
    'Ensure that no actions and clicks to be performed on disabled CTAs and Left navigation panel.' +
    "Complete the Booking by clicking 'Continue & Pay' at the final step of the form. If there is 'Booking complete!' text on the screen that means you booked a shift successfully." +
    'These are the few steps you need to follow to ensure the booking is successful' +
    '- You are going to need a Work Site. Select a Work Site, If it is already selected move on to next step' +
    "- Now you need date of the shift. Give a start date, (always necessary) that is between 2 to 8 days into the future from current day. Date will get selected only when you Click 'Done' button in date picker" +
    '- You need to Select time for shift. First click open the place holder for time slots and select the time by clicking on the selected time for Start time and for End time and also for Unpaid Break. check if time actually got selected. All three of them should have inputs filled to get past to next steps' +
    '- Now Select Position' +
    '- Navigate to the Next Page. Before navigating, ensure all required details are correctly filled.' +
    'Click the primary Call to Action (CTA) button to proceed to the next page.'

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
