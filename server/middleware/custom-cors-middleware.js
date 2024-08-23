import logger from "../logger/logger.js"

const URL = process.env.URL || "http://localhost:5173"

const whitelist = [URL]

// Custom CORS middleware
const customCorsMiddleware = (req, res, next) => {
  const origin = req.headers.origin

  // Check if the origin is in the whitelist
  if (whitelist.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin)
    res.header("Access-Control-Allow-Methods", "POST")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    next()
  } else {
    logger.warn(`Blocked request from origin: ${origin}`)
    res.status(403).send("Forbidden: Origin not allowed")
  }
}

export default customCorsMiddleware
