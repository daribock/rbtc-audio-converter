import path from "path"
import { fileURLToPath } from "url"

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const ROOT_PATH = path.join(__dirname, "../..")

export const REDIS_HOST = process.env.REDIS_HOST || "0.0.0.0"
export const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT)
  : 6379
export const REDIS_CONNECTION_CONFIG = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password:
    process.env.NODE_ENV === "production"
      ? process.env.REDIS_PASSWORD
      : undefined,
}

// Define the logo path
export const LOGO_PATH = path.join(__dirname, "../assets/logo.jpg")

// Default BullMQ jobs remove config
export const DEFAULT_JOB_REMOVE_CONFIG = {
  removeOnComplete: {
    age: 3600,
    count: 5,
  },
  removeOnFail: {
    age: 24 * 3600,
  },
}

export const UPLOAD_DIR = "uploads/"
export const PROCESSED_DIR = "processed/"
export const DOWNLOAD_DIR = "downloads/"
export const PUBLIC_DIR = "dist/"
