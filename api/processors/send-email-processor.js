import logger from "../utils/logger.js"
import sendEmail from "../utils/email.js"
import { checkFoldersExistAsync } from "../utils/file-utils.js"

export default async function sendEmailProcessor(job) {
  const { jobId, email } = job.data

  job.log(`Started processing job with id ${job.id}`)
  logger.info(`Job with id ${job.id}`, job.data)

  // Check if files have not been converted yet
  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (
      !convertFoldersExist.downloadsExists ||
      !convertFoldersExist.processedExists
    ) {
      job.log(`Files for ${jobId} have not been converted yet`)
      logger.info(`Files for ${jobId} have not been converted yet`)
      job.moveToFailed()
    }
  } catch (err) {
    job.log(`Failed to check if files for ${jobId} have already been converted`)
    logger.info(
      `Failed to check if files for ${jobId} have already been converted`,
    )
    job.moveToFailed()
  }

  logger.info(`Send email to ${email} for ${jobId}`)
  job.log(`Send email to ${email} for ${jobId}`)

  // Try to send email
  try {
    await sendEmail(email, jobId)
  } catch (error) {
    logger.error(`Error sending email to ${email}`, error)
    job.moveToFailed()
    throw new Error("Error sending email")
  }

  job.updateProgress(100)
  return "DONE"
}
