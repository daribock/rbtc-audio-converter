import { Queue } from "bullmq"
import { REDIS_CONNECTION_CONFIG } from "../config/config.js"
import { fileProcessorWorker } from "../worker.js"

export const fileProcessorQueue = new Queue("fileProcessorQueue", {
  connection: REDIS_CONNECTION_CONFIG,
})

fileProcessorWorker()
