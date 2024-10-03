import { Worker } from "bullmq"
import path from "path"
import { fileURLToPath } from "url"
import { REDIS_QUEUE_HOST, REDIS_QUEUE_PORT } from "./config/config.js"
import logger from "./utils/logger.js"

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const processorPath = path.join(__dirname, "file-processor.js")

export function setUpWorker() {
  const worker = new Worker("fileProcessorQueue", processorPath, {
    connection: {
      host: REDIS_QUEUE_HOST,
      port: REDIS_QUEUE_PORT,
    },
    autorun: true,
  })

  worker.on("completed", (job, returnValue) => {
    logger.info(`Completed job with id ${job.id}`, returnValue)
  })

  worker.on("active", (job) => {
    logger.info(`Completed job with id ${job.id}`)
  })

  worker.on("error", (failedReason) => {
    logger.error(`Job encountered an error`, failedReason)
  })
}
