import { initialiseExtensionAndEnterPrompt, setupDriver, trackExtensionLogs } from './setupHelpers'
import { config } from './config'
import { logger } from './logger'
import fs from 'fs'
import { loginPrompt } from './promptLibrary/prompts'
import { createRecorder } from './videoRecorder'

const prompt = loginPrompt

const navigateAndQatomate = async (prompt: string) => {
    try {
        const recorder = createRecorder({
            outputPath: `${config.artifactsDir}/qatomator-screen-recording.mp4`,
        })
        const driver = await setupDriver()
        recorder.start()
        logger.info(`Navigating to ${config.targetEnvUrl}`)
        await driver.get(config.targetEnvUrl)
        // Todo: expand to different entrypoints
        await initialiseExtensionAndEnterPrompt(driver, prompt)
        await trackExtensionLogs(driver)

        fs.watch(config.downloadsDir, async (eventType, filename) => {
            if (filename === 'TERMINATE_ME.json') {
                logger.info('Received TERMINATE_ME.json. Will stop the run after 5 seconds ...')
                await recorder.stop()
                await driver.quit()
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

// If an uncaught exception or unhandled rejection occurs, log the error and exit the process.
// This will help in debugging issues that may occur in child processes.
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Start the automation process.
navigateAndQatomate(prompt)
