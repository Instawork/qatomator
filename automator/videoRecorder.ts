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
            .outputOptions([
                '-movflags +faststart',  // Optimize for web playback
                '-preset ultrafast',     // Use ultrafast encoding preset for real-time encoding
                '-crf 23',                // Constant Rate Factor for balance between quality and file size
            ])

        ffmpegCommand.on('start', (commandLine) => {
            logger.info(`Spawned ffmpeg with command: ${commandLine}`)
        })

        ffmpegCommand.on('stderr', (stderrLine) => {
            logger.debug(`FFmpeg stderr: ${stderrLine}`)
        })

        ffmpegCommand.on('error', (err, stdout, stderr) => {
            logger.error(`FFmpeg error: ${err.message}`)
            logger.error(`FFmpeg stderr: ${stderr}`)
        })

        ffmpegCommand.on('end', () => {
            logger.info('FFmpeg process ended')
        })

        ffmpegCommand.run()
    }

    const stop = async (): Promise<void> => {
        logger.info('Stopping video recording')
        return new Promise<void>((resolve, reject) => {
            if (ffmpegCommand && (ffmpegCommand as any).ffmpegProc) {
                const ffmpegProc = (ffmpegCommand as any).ffmpegProc

                ffmpegCommand.on('end', () => {
                    logger.info('Video recording stopped successfully')
                    resolve()
                })

                ffmpegCommand.on('error', (err) => {
                    logger.error(`Error stopping video recording: ${err.message}`)
                    reject(err)
                })

                // Safely end the ffmpeg process
                if (ffmpegProc.stdin) {
                    ffmpegProc.stdin.write('q')
                } else {
                    logger.warn('Unable to access ffmpeg stdin, falling back to kill method')
                    ffmpegCommand.kill('SIGTERM')
                }
            } else {
                logger.warn('No active ffmpeg process to stop')
                resolve()
            }
        })
    }

    return { start, stop }
}

export { createRecorder, VideoRecorderOptions }
