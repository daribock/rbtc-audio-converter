import { Queue } from "bullmq"
import { REDIS_CONNECTION_CONFIG } from "../config/config.js"
import { createZipFolderWorker } from "../worker.js"

export const createZipFolderQueue = new Queue("createZipFolderQueue", {
  connection: REDIS_CONNECTION_CONFIG,
})

createZipFolderWorker()
