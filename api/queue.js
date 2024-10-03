import { Queue } from "bullmq"
import { REDIS_QUEUE_HOST, REDIS_QUEUE_PORT } from "./config/config.js"
import { setUpWorker } from "./worker.js"

const DEFAULT_REMOVE_CONFIG = {
  removeOnComplete: {
    age: 3600,
    count: 5,
  },
  removeOnFail: {
    age: 24 * 3600,
  },
}

export const fileProcessorQueue = new Queue("fileProcessorQueue", {
  connection: {
    host: REDIS_QUEUE_HOST,
    port: REDIS_QUEUE_PORT,
  },
})

export async function addJobToFileProcessorQueue(data) {
  const { fileId } = data

  return fileProcessorQueue.add("processFile", data, DEFAULT_REMOVE_CONFIG, {
    debounce: { id: fileId, ttl: 5000 },
  })
}

setUpWorker()
