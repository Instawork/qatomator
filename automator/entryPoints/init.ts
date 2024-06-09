import logger from '../logger'
import fs from 'fs'
import path from 'path'
import findRoot from 'find-root'

export const checkSetup = async () => {
    if (!process.env.OPENAI_API_KEY) {
        logger.error('OPENAI_API_KEY Env Var not configured')
        throw new Error('OPENAI_API_KEY Env Var not configured')
    }
}

export const downloadDir = path.resolve(findRoot(__dirname), 'reports')
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true })
}
logger.info(downloadDir)

// const prefs = new logging.Preferences()
// prefs.setLevel(logging.Type.CLIENT, logging.Level.ALL)
//
// const options = new chrome.Options()
//     // .addArguments('--headless=new')
//     .addArguments('--disable-gpu')
//     .addArguments('--no-sandbox')
//     .addArguments('--disable-dev-shm-usage')
//     .addArguments('--load-extension=extension/build')
//     .windowSize({ width: 1440, height: 900 })
//     .addArguments('--silent-debugger-extension-api')
//     .setUserPreferences({
//         'download.prompt_for_download': false,
//         'download.default_directory': downloadDir,
//         'download.directory_upgrade': true,
//     })
// // .setLoggingPrefs(prefs)
//
// options.setLoggingPrefs(prefs)
//
// const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
