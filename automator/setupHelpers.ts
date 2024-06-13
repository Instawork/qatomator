/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from './logger'
import { Builder, By, Key, WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { ChromiumWebDriver } from 'selenium-webdriver/chromium'
import { config } from './config'

/**
 * TO ADD
 *
 * @param   whatsit  The whatsit to use (or whatever).
 * @returns A useful value.
 */
export const setupDriver = async () => {
    const options = new chrome.Options()
        .addArguments('--headless=new')
        .addArguments('--disable-gpu')
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage')
        .addArguments(`--load-extension=${config.extensionBuildDir}`)
        .windowSize({ width: 1440, height: 900 })
        .addArguments('--silent-debugger-extension-api')
        .setUserPreferences({
            'download.prompt_for_download': false,
            'download.default_directory': config.downloadsDir,
            'download.directory_upgrade': true,
        })

    // const prefs = new logging.Preferences()
    // prefs.setLevel(logging.Type.CLIENT, logging.Level.ALL)
    //     options.setLoggingPrefs(prefs)

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(<chrome.Options>options)
        .build()

    await (<ChromiumWebDriver>driver).sendDevToolsCommand('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: config.downloadsDir,
    })

    logger.info('Driver setup complete')
    return driver
}

/**
 * TO ADD
 *
 * @param   whatsit  The whatsit to use (or whatever).
 * @returns A useful value.
 */
export const initialiseExtensionAndEnterPrompt = async (driver: WebDriver, prompt: string) => {
    const getExtensionUrl = async (attempts: number, maxRetries: number = 3): Promise<string> => {
        const targets: any = await (<ChromiumWebDriver>driver).sendAndGetDevToolsCommand(
            'Target.getTargets',
            {},
        )
        const extensionTarget = await targets.targetInfos.find(
            (target: { type: string; url: string }) =>
                target.type === 'service_worker' && target.url.includes('chrome-extension://'),
        )
        if (!extensionTarget) {
            if (attempts < maxRetries) {
                await driver.sleep(2000)
                logger.warn(`Attempt ${attempts} failed". Extension not loaded. Retrying...`)
                return getExtensionUrl(attempts++)
            } else {
                logger.error(`Failed to get extension target after ${maxRetries} attempts`)
                throw new Error('Failed to get extension target')
            }
        }
        return `chrome-extension://${extensionTarget.url.split('/')[2]}/panel.html?tab=0`
    }
    const extensionUrl = await getExtensionUrl(0)

    await driver.executeScript('window.open()')
    // await driver.switchTo().newWindow('tab');
    const windows = await driver.getAllWindowHandles()
    await driver.switchTo().window(windows[1])
    await driver.get(extensionUrl)

    await driver
        .findElement(By.css('[data-testid="openai-api-key-input"]'))
        .sendKeys(config.openAiKey)
    await driver.findElement(By.css('[data-testid="save-key-button"]')).click()
    await driver
        .findElement(By.css('[data-testid="main-task-prompt"]'))
        .sendKeys(prompt, Key.RETURN)
    await driver.switchTo().window(windows[0])

    logger.info('Extension initialised, prompt entered, QAtomator taking over.')
}
