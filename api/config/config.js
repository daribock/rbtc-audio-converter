import path from "path"
import { fileURLToPath } from "url"

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const REDIS_QUEUE_HOST = process.env.REDIS_QUEUE_HOST || "0.0.0.0"
export const REDIS_QUEUE_PORT = process.env.REDIS_QUEUE_PORT
  ? parseInt(process.env.REDIS_QUEUE_PORT)
  : 6379

// Define the logo path
export const LOGO_PATH = path.join(__dirname, "../assets/logo.png")
