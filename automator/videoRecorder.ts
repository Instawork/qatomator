import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import os from 'os'

// Set the path to the FFmpeg binaries
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
    if (platform === 'darwin') {
        return {
            outputPath: 'test-recording.mp4',
            inputFormat: 'avfoundation',
            fps: 30,
            videoCodec: 'libx264',
            size: '1920x1080',
            input: '1:0', // This captures the entire screen on macOS
        }
    } else if (platform === 'linux') {
        return {
            outputPath: 'test-recording.mp4',
            inputFormat: 'x11grab',
            fps: 30,
            videoCodec: 'libx264',
            size: '1920x1080',
            input: ':0.0', // This captures the entire screen on most Linux setups
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
