/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from './logger'
import { Builder, By, Key, logging, WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { ChromiumWebDriver } from 'selenium-webdriver/chromium'
import { config } from './config'
import CDP from 'chrome-remote-interface'

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

    const prefs = new logging.Preferences()
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL)
    options.setLoggingPrefs(prefs)

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(<chrome.Options>options)
        .build()

    await (<ChromiumWebDriver>driver).sendDevToolsCommand('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: config.downloadsDir,
    })

    await driver.manage().setTimeouts({ implicit: 10000 })

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
                return getExtensionUrl(attempts + 1)
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

    const lines = prompt.trim().split('\n')
    for (const line of lines) {
        await driver
            .findElement(By.css('[data-testid="main-task-prompt"]'))
            .sendKeys(line, Key.chord(Key.SHIFT, Key.RETURN))
    }
    await driver
        .findElement(By.css('[data-testid="main-task-prompt"]'))
        .sendKeys(prompt, Key.RETURN)
    await driver.switchTo().window(windows[0])

    logger.info('Extension initialised, prompt entered, QAtomator taking over.')
}

/**
 * TO ADD
 *
 * @returns A useful value.
 * @param driver
 * @param keepAlive
 */
export const trackExtensionLogs = async (driver: WebDriver) => {
    const cdpConnection = await driver.createCDPConnection('page')
    const client = await CDP({ target: cdpConnection._wsConnection._url })
    // const setupListeners = async () => {
    client.on('Runtime.consoleAPICalled', async (event) => {
        const args = event.args
        if (args.length && args[0].value) {
            if (['log', 'debug', 'info'].includes(event.type)) {
                logger.info(JSON.stringify(args[0].value))
            } else if (['warning'].includes(event.type)) {
                logger.warn(JSON.stringify(args[0].value))
            } else if (['error'].includes(event.type)) {
                logger.error(JSON.stringify(args[0].value))
            } else {
                logger.debug(`${event.type}: ${JSON.stringify(args[0].value)}`)
            }
        }
    })
    // }
    // await setupListeners()
    await client.Runtime.enable()
    // await client.Page.enable()
    // client.on('Page.frameNavigated', async (event) => {
    //     logger.info(`Page has navigated to: ${event.frame.url}`)
    //     await client.Runtime.enable()
    // })
}
