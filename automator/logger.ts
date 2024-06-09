import winston from 'winston'

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.cli()),
    transports: [new winston.transports.Console()],
    exceptionHandlers: [new winston.transports.File({ filename: 'exception.log' })],
    rejectionHandlers: [new winston.transports.File({ filename: 'rejections.log' })],
})

export default logger
