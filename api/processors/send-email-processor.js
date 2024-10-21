import logger from "../utils/logger.js"
import sendEmail from "../utils/email.js"

export default async function sendEmailProcessor(job) {
  const { jobId, email } = job.data

  await job.log(`Started processing job with id ${job.id}`)
  logger.info(`Job with id ${job.id}`, job.data)

  logger.info(`Send email to ${email} for ${jobId}`)
  job.log(`Send email to ${email} for ${jobId}`)

  try {
    await sendEmail(email, jobId)
  } catch (error) {
    logger.error(`Error sending email to ${email}`, error)
    job.moveToFailed()
    throw new Error("Error sending email")
  }

  await job.updateProgress(100)
  return "DONE"
}
