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
 * TO ADD
 */
export const config: Config = {
    openAiKey: process.env.OPENAI_API_KEY || '',
    maxTimeout: 300000, // 5 minutes
    targetEnvUrl: process.env.BACKEND_URL ?? 'https://qa.instawork.com',
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
