import winston from "winston"

const logger = winston.createLogger({
  level: "warn",
  format: winston.format.json(),
  transports: [
    // Write all logs with importance level of `error` or higher to `error.log`
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    // Write all logs with importance level of `warn` or higher to `combined.log`
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
})

// If we're not in production then log to the `console`
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...args }) => {
          const meta = `; Meta: ${JSON.stringify({ ...args })}`

          return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}`
        }),
      ),
    }),
  )
}

export default logger
