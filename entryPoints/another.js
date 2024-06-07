const { Builder, By, Key } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const fs = require('fs')
const { resolve } = require('path')

async function checkSetup() {
    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY Env Var not configured')
        throw new Error('OPENAI_API_KEY Env Var not configured')
    }
}

async function initialiseExtensionAndEnterPrompt(driver, prompt) {
    // Use CDP to get the list of targets (including extensions)
    let targets = await driver.sendAndGetDevToolsCommand('Target.getTargets', {})

    let extensionTarget = targets.targetInfos.find(
        (target) => target.type === 'service_worker' && target.url.includes('chrome-extension://'),
    )

    if (!extensionTarget) {
        console.error('Extension not found')
        throw new Error('Extension not found')
    }

    // Extract the extension ID and construct the popup URL
    let extensionId = extensionTarget.url.split('/')[2]
    let extensionPopupUrl = `chrome-extension://${extensionId}/panel.html?tab=0`

    await driver.executeScript('window.open()')
    let windows = await driver.getAllWindowHandles()
    await driver.switchTo().window(windows[1])
    await driver.get(extensionPopupUrl)

    await driver
        .findElement(By.css('[data-testid="openai-api-key-input"]'))
        .sendKeys(process.env.OPENAI_API_KEY)
    await driver.findElement(By.css('[data-testid="save-key-button"]')).click()
    await driver
        .findElement(By.css('[data-testid="main-task-prompt"]'))
        .sendKeys(prompt, Key.RETURN)

    let stepScreenshot = await driver.takeScreenshot()
    fs.writeFileSync('reports/extension-ss.png', stepScreenshot, 'base64')
    await driver.switchTo().window(windows[0])
}

;(async function mainTest() {
    const downloadDir = resolve(__dirname, '../../', 'reports/ai-explorer-downloads')
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true })
    }

    let options = new chrome.Options()
        // .addArguments('--headless=new')
        .addArguments('--disable-gpu')
        .addArguments('--no-sandbox')
        .addArguments('--disable-dev-shm-usage')
        .addArguments('--load-extension=extension/build')
        .windowSize({ width: 1440, height: 900 })
        .addArguments('--silent-debugger-extension-api')
        .setUserPreferences({
            'download.prompt_for_download': false,
            'download.default_directory': downloadDir,
            'download.directory_upgrade': true,
        })

    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()

    try {
        // Set up the environment
        await checkSetup()
        await driver.sendDevToolsCommand('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir,
        })

        await driver.get('https://qa.instawork.com') // Replace with the actual home page URL
        await driver.sleep(500000) // Give some time for extension to load. todo: Make it query & check instead
        await initialiseExtensionAndEnterPrompt(
            driver,
            'You are to login with username: Matthew2052Owensb353WebCompany@instawork.com and password test123 and book a shift for next week via "Book Instawork Pros"',
        )

        // Capture screenshots
        let screenshot1 = await driver.takeScreenshot()
        fs.writeFileSync('reports/starting-run.png', screenshot1, 'base64')
        await driver.sleep(60000)
        let screenshot2 = await driver.takeScreenshot()
        fs.writeFileSync('reports/ending-run-soon.png', screenshot2, 'base64')
        await driver.sleep(10000)

        let windows = await driver.getAllWindowHandles()
        await driver.switchTo().window(windows[1])
        let stepScreenshot = await driver.takeScreenshot()
        fs.writeFileSync('reports/extension-ss2.png', stepScreenshot, 'base64')

        // List the downloaded files
        let files = fs.readdirSync(downloadDir)
        console.log('Downloaded files:', files)

        const logs = await driver.executeScript(() => {
            return new Promise((resolve) => {
                chrome.storage.local.get('logs', (result) => {
                    resolve(result.logs)
                })
            })
        })
        console.log(logs)
        fs.writeFileSync('reports/extension-logs-headless.txt', logs.join('\n'), 'utf-8')
    } finally {
        await driver.quit()
    }
})()
