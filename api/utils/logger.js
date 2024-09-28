import winston from "winston"

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...args }) => {
      const meta =
        process.env.NODE_ENV === "production"
          ? undefined
          : `; Meta: ${JSON.stringify({ ...args })}`

      return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}`
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
})

export default logger
