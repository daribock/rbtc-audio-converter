import { Queue } from "bullmq"
import { REDIS_QUEUE_HOST, REDIS_QUEUE_PORT } from "../config/config.js"
import { cleanupWorker } from "../worker.js"

export const cleanupQueue = new Queue("cleanupQueue", {
  connection: {
    host: REDIS_QUEUE_HOST,
    port: REDIS_QUEUE_PORT,
  },
})

cleanupWorker()
