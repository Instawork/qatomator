// export const checkSetup = async () => {
//     if (!process.env.OPENAI_API_KEY) {
//         console.error('OPENAI_API_KEY Env Var not configured')
//         throw new Error('OPENAI_API_KEY Env Var not configured')
//     }
// }
// import logger from '../logger'
// import {resolve} from "path";
// import fs from "fs";
//
// logger.info('Hello world')
//
//     const downloadDir = resolve(__dirname, '../../', 'reports/downloads')
//     if (!fs.existsSync(downloadDir)) {
//         fs.mkdirSync(downloadDir, { recursive: true })
//     }
//
//     let prefs = new logging.Preferences()
//     prefs.setLevel(logging.Type.CLIENT, logging.Level.ALL)
//
//     let options = new chrome.Options()
//         // .addArguments('--headless=new')
//         .addArguments('--disable-gpu')
//         .addArguments('--no-sandbox')
//         .addArguments('--disable-dev-shm-usage')
//         .addArguments('--load-extension=extension/build')
//         .windowSize({ width: 1440, height: 900 })
//         .addArguments('--silent-debugger-extension-api')
//         .setUserPreferences({
//             'download.prompt_for_download': false,
//             'download.default_directory': downloadDir,
//             'download.directory_upgrade': true,
//         })
//     // .setLoggingPrefs(prefs)
//
//     options.setLoggingPrefs(prefs)
//
//     let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
