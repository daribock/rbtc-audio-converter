import logger from "../utils/logger.js"
import path from "path"
import { cleanupDirectories, getFoldersByJobId } from "../utils/file.js"
import { sendEmailQueue } from "./../queues/send-email-queue.js"
import { ROOT_PATH, UPLOAD_DIR } from "../config/config.js"

export default async function cleanupProcessor(job) {
  const { jobId } = job.data

  job.log(`Started processing cleanup job with id ${job.id}`)
  logger.debug(`Started processing cleanup job with id ${job.id}`)

  const { processedPath, downloadsPath } = getFoldersByJobId(jobId)

  // Get the failed send email job if there is one
  const failedJobs = await sendEmailQueue.getFailed()
  const isSendEmailJobFailed = !!failedJobs.find(
    (failedJob) => failedJob.data.jobId === jobId,
  )

  // If there is a failed send email job for this job then delete the processed folder and downloads folder else delete the whole job folder
  if (isSendEmailJobFailed) {
    await cleanupDirectories([processedPath, downloadsPath])
    job.log(`Deleted processed and download folder for ${jobId}`)
    logger.warn(`Deleted processed and download folder for ${jobId}`)
  } else {
    // Delete whole job folder
    const jobPath = path.join(ROOT_PATH, UPLOAD_DIR, jobId)

    await cleanupDirectories([jobPath])
    job.log(`Deleted whole job folder for ${jobId}`)
    logger.info(`Deleted whole job folder for ${jobId}`)
  }

  job.updateProgress(100)
  return "DONE"
}
