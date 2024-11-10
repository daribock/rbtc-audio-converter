import { Queue } from "bullmq"
import { REDIS_CONNECTION_CONFIG } from "../config/config.js"
import { cleanupWorker } from "../worker.js"

export const cleanupQueue = new Queue("cleanupQueue", {
  connection: REDIS_CONNECTION_CONFIG,
})

cleanupWorker()
