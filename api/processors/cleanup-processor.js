import logger from "../utils/logger.js"
import path from "path"
import { cleanupDirectories, getFoldersByJobId } from "../utils/file-utils.js"
import { sendEmailQueue } from "./../queues/send-email-queue.js"
import { ROOT_PATH, UPLOAD_DIR } from "../config/config.js"

export default async function cleanupProcessor(job) {
  const { jobId } = job.data

  job.log(`Started processing job with id ${job.id}`)
  logger.info(`Started processing job with id ${job.id}`)

  job.log(`Started deleting files for ${jobId}`)
  logger.info(`Started deleting files for ${jobId}`)

  const { processedPath, downloadsPath } = getFoldersByJobId(jobId)

  const failedJobs = await sendEmailQueue.getFailed()
  const failedSendEmailJob = failedJobs.find(
    (failedJob) => failedJob.data.jobId === jobId,
  )

  // If there is a failed send email job for this job then delete the processed folder and downloads folder else delete the whole job folder
  if (failedSendEmailJob) {
    await cleanupDirectories([processedPath, downloadsPath])
  } else {
    // Delete whole job folder
    const jobPath = path.join(ROOT_PATH, UPLOAD_DIR, jobId)

    await cleanupDirectories([jobPath])
  }

  job.log(`Processing DONE`)
  job.updateProgress(100)
  return "DONE"
}
