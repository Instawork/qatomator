import logger from '../logger'
import fs from 'fs'
import path from 'path'
import findRoot from 'find-root'
import { Builder, By, Key, WebDriver } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { ChromiumWebDriver } from 'selenium-webdriver/chromium'
import { config } from '../config'

export const setupDriver = async () => {
    const downloadDir = config.downloadsDir
    const extensionsDir = path.resolve(findRoot(__dirname), 'extension/build')

    const options = new chrome.Options()
        .addArguments('--headless=new')
        .addArguments('--disable-gpu')
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage')
        .addArguments(`--load-extension=${extensionsDir}`)
        .windowSize({ width: 1440, height: 900 })
        .addArguments('--silent-debugger-extension-api')
        .setUserPreferences({
            'download.prompt_for_download': false,
            'download.default_directory': downloadDir,
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
        downloadPath: downloadDir,
    })

    return driver
}

export const initialiseExtensionAndEnterPrompt = async (driver: WebDriver, prompt: string) => {
    // Access Extensions via CDP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targets: any = await (<ChromiumWebDriver>driver).sendAndGetDevToolsCommand(
        'Target.getTargets',
        {},
    )

    const extensionTarget = targets.targetInfos.find(
        (target: { type: string; url: string | string[] }) =>
            target.type === 'service_worker' && target.url.includes('chrome-extension://'),
    )
    if (!extensionTarget) {
        logger.error('Extension not found')
        throw new Error('Extension not found')
    }

    // Enter prompt in extension panel.html
    const extensionUrl = `chrome-extension://${extensionTarget.url.split('/')[2]}/panel.html?tab=0`

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

    const stepScreenshot = await driver.takeScreenshot()
    fs.writeFileSync(`${config.downloadsDir}/extension-ss.png`, stepScreenshot, 'base64')
    await driver.switchTo().window(windows[0])
}
