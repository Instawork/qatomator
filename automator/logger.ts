import winston from 'winston'
const { combine, timestamp, colorize, printf } = winston.format

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    ),
    transports: [
        new winston.transports.File({
            filename: 'artifacts/logs.log',
        }),
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }),
                printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
            ),
        }),
    ],
    exceptionHandlers: [new winston.transports.File({ filename: 'artifacts/exceptions.log' })],
    rejectionHandlers: [new winston.transports.File({ filename: 'artifacts/rejections.log' })],
})
