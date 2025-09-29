import process from "process"
import logger from "../utils/logger.js"

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500
  const responseBody = {
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  }

  logger.error(responseBody)

  // If headers are already sent, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err)
  }

  res.status(statusCode).json(responseBody)
}

export default errorHandler
