import { logger } from './logger'
import findRoot from 'find-root'
import path from 'path'
import fs from 'fs'

interface Config {
    openAiKey: string
    maxTimeout: number
    targetEnvUrl: string
    extensionBuildDir: string
    artifactsDir: string
    downloadsDir: string
}

/**
 * Configuration object containing various settings and directory paths used in the application.
 *
 * @type {Config}
 * @property {string} openAiKey - The API key for OpenAI, sourced from the environment variable OPENAI_API_KEY.
 * @property {number} maxTimeout - The maximum timeout value for operations, set to 450000 milliseconds (7.5 minutes).
 * @property {string} targetEnvUrl - The target environment URL, sourced from the environment variable BACKEND_URL or set to a default value.
 * @property {string} extensionBuildDir - The directory path for the extension build, resolved relative to the project root.
 * @property {string} artifactsDir - The directory path for artifacts, resolved relative to the project root.
 * @property {string} downloadsDir - The directory path for downloads, resolved relative to the artifacts directory.
 */
export const config: Config = {
    openAiKey: process.env.OPENAI_API_KEY || '',
    maxTimeout: 60000, // 1 minute
    targetEnvUrl: process.env.BACKEND_URL ?? 'https://app.staging2.instawork.com',
    extensionBuildDir: path.resolve(findRoot(__dirname), 'extension/build'),
    artifactsDir: path.resolve(findRoot(__dirname), 'artifacts'),
    downloadsDir: path.resolve(findRoot(__dirname), 'artifacts/downloads'),
}

if (!config.openAiKey) {
    logger.error('OPENAI_API_KEY environment variable is not set.')
    throw new Error('OPENAI_API_KEY environment variable is required.')
}

if (!fs.existsSync(config.downloadsDir)) {
    fs.mkdirSync(config.downloadsDir, { recursive: true })
}
