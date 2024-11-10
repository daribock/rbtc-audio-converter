import { Queue } from "bullmq"
import { REDIS_CONNECTION_CONFIG } from "../config/config.js"
import { sendEmailWorker } from "../worker.js"

export const sendEmailQueue = new Queue("sendEmailQueue", {
  connection: REDIS_CONNECTION_CONFIG,
})

sendEmailWorker()
