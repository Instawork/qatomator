import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import os from 'os'
import { logger } from './logger'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

interface VideoRecorderOptions {
    outputPath: string
    inputFormat: string
    fps: number
    videoCodec: string
    size: string
    input: string
}

const getDefaultOptions = (): VideoRecorderOptions => {
    const platform = os.platform()
    const isCI = process.env.CI === 'true'
    logger.info(`Platform: ${platform}, CI: ${isCI}`)
    if (platform === 'darwin' && !isCI) {
        logger.info('Using recoding options for macOS')
        return {
            outputPath: 'test-recording.mp4',
            inputFormat: 'avfoundation',
            fps: 30,
            videoCodec: 'libx264',
            size: '1920x1080',
            input: '1:0',
        }
    } else if (platform === 'linux' || isCI) {
        const display = process.env.DISPLAY || ':99'
        logger.info(`Using recoding options for Linux with display: ${display}`)
        return {
            outputPath: 'test-recording.mp4',
            inputFormat: 'x11grab',
            fps: 30,
            videoCodec: 'libx264',
            size: '1920x1080',
            input: `${display}`,
        }
    } else {
        throw new Error(`Unsupported platform: ${platform}`)
    }
}

const createRecorder = (recorderOptions: Partial<VideoRecorderOptions> = {}) => {
    const defaultOptions = getDefaultOptions()
    const videoConfig: VideoRecorderOptions = { ...defaultOptions, ...recorderOptions }
    let ffmpegCommand: ffmpeg.FfmpegCommand | null = null

    const start = () => {
        logger.info(`Starting video recording with options: ${JSON.stringify(videoConfig)}`)
        ffmpegCommand = ffmpeg()
            .input(videoConfig.input)
            .inputFormat(videoConfig.inputFormat)
            .inputFPS(videoConfig.fps)
            .output(videoConfig.outputPath)
            .videoCodec(videoConfig.videoCodec)
            .size(videoConfig.size)

        ffmpegCommand.run()
    }

    const stop = async (): Promise<void> => {
        logger.info('Stopping video recording')
        return new Promise<void>((resolve) => {
            if (ffmpegCommand) {
                ffmpegCommand.kill('SIGINT')
            }
            resolve()
        })
    }

    return { start, stop }
}

export { createRecorder, VideoRecorderOptions }
