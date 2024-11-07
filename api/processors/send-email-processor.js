import logger from "../utils/logger.js"
import sendEmail from "../utils/email.js"
import { checkFoldersExistAsync } from "../utils/file-utils.js"

export default async function sendEmailProcessor(job) {
  const { jobId, email } = job.data

  job.log(`Started processing send email job with id ${job.id}`)
  logger.info(`Started processing send email job with id ${job.id}`)

  // Check if files have not been converted yet
  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (
      !convertFoldersExist.downloadsExists ||
      !convertFoldersExist.processedExists
    ) {
      const error = new Error(`Files for ${jobId} have not been converted yet`)

      job.log(error.message)
      logger.error(error.message)
      await job.moveToFailed(error, true)
    }
  } catch (err) {
    const error = new Error(
      `Failed to check if files for ${jobId} have already been converted`,
    )

    job.log(error.message)
    logger.error({
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
    await job.moveToFailed(error, true)
  }

  logger.info(`Send email for ${jobId}`)
  job.log(`Send email for ${jobId}`)

  // Try to send email
  try {
    await sendEmail(email, jobId)
  } catch (err) {
    const error = new Error(`Error sending email for ${jobId}`)

    job.log(error.message)
    logger.error({
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
    await job.moveToFailed(error, true)
  }

  job.log(`Successfully Finished processing send email job with id ${job.id}`)
  logger.info(
    `Successfully Finished processing send email job with id ${job.id}`,
  )
  job.updateProgress(100)
  return "DONE"
}
