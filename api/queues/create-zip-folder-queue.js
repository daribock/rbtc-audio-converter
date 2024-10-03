import { Queue } from "bullmq"
import { REDIS_QUEUE_HOST, REDIS_QUEUE_PORT } from "../config/config.js"
import { createZipFolderWorker } from "../worker.js"

export const createZipFolderQueue = new Queue("createZipFolderQueue", {
  connection: {
    host: REDIS_QUEUE_HOST,
    port: REDIS_QUEUE_PORT,
  },
})

createZipFolderWorker()
