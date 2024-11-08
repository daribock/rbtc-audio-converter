import { Worker } from "bullmq"
import path from "path"
import { fileURLToPath } from "url"
import { REDIS_CONNECTION_CONFIG } from "./config/config.js"
import logger from "./utils/logger.js"

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fileProcessorPath = path.join(__dirname, "processors/file-processor.js")
const zipFolderProcessor = path.join(
  __dirname,
  "processors/zip-folder-processor.js",
)
const sendEmailProcessor = path.join(
  __dirname,
  "processors/send-email-processor.js",
)
const cleanupProcessor = path.join(__dirname, "processors/cleanup-processor.js")

const createWorker = (queueName, processorPath) => {
  const worker = new Worker(queueName, processorPath, {
    connection: REDIS_CONNECTION_CONFIG,
    autorun: true,
  })

  worker.on("completed", (job) => {
    logger.info(
      `Job with id ${job.id} in queue ${queueName} completed successfully`,
    )
  })

  worker.on("active", (job) => {
    logger.info(`Job with id ${job.id} in queue ${queueName} is now active`)
  })

  worker.on("failed", (job, err) => {
    logger.error(`Job with id ${job.id} in queue ${queueName} failed`, {
      error: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
  })

  worker.on("error", (err) => {
    logger.error(`Worker error in queue ${queueName}`, {
      error: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
  })

  return worker
}

export const fileProcessorWorker = () => {
  return createWorker("fileProcessorQueue", fileProcessorPath)
}

export const createZipFolderWorker = () => {
  return createWorker("createZipFolderQueue", zipFolderProcessor)
}

export const sendEmailWorker = () => {
  return createWorker("sendEmailQueue", sendEmailProcessor)
}

export const cleanupWorker = () => {
  return createWorker("cleanupQueue", cleanupProcessor)
}
