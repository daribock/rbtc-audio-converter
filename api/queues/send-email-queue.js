import { Queue } from "bullmq"
import { REDIS_QUEUE_HOST, REDIS_QUEUE_PORT } from "../config/config.js"
import { sendEmailWorker } from "../worker.js"

export const sendEmailQueue = new Queue("sendEmailQueue", {
  connection: {
    host: REDIS_QUEUE_HOST,
    port: REDIS_QUEUE_PORT,
  },
})

sendEmailWorker()
