import { Worker } from "bullmq"
import path from "path"
import { fileURLToPath } from "url"
import { REDIS_QUEUE_HOST, REDIS_QUEUE_PORT } from "./config/config.js"
import logger from "./utils/logger.js"

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fileProcessorPath = path.join(__dirname, "processors/file-processor.js")
const zipFolderProcessor = path.join(
  __dirname,
  "processors/zip-folder-processor.js",
)

export const fileProcessorWorker = () => {
  const worker = new Worker("fileProcessorQueue", fileProcessorPath, {
    connection: {
      host: REDIS_QUEUE_HOST,
      port: REDIS_QUEUE_PORT,
    },
    autorun: true,
  })

  worker.on("completed", (job) => {
    logger.info(`Completed job with id ${job.id}`)
  })

  worker.on("active", (job) => {
    logger.info(`Completed job with id ${job.id}`)
  })

  worker.on("error", (failedReason) => {
    logger.error(`Job encountered an error`, failedReason)
  })
}

export const createZipFolderWorker = () => {
  const worker = new Worker("createZipFolderQueue", zipFolderProcessor, {
    connection: {
      host: REDIS_QUEUE_HOST,
      port: REDIS_QUEUE_PORT,
    },
    autorun: true,
  })

  worker.on("completed", (job) => {
    logger.info(`Completed zip folder creation job with id ${job.id}`)
  })

  worker.on("active", (job) => {
    logger.info(`Completed zip folder creation job with id ${job.id}`)
  })

  worker.on("error", (failedReason) => {
    logger.error(`Zip folder creation job encountered an error`, failedReason)
  })
}
