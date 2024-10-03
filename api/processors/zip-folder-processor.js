import logger from "../utils/logger.js"

export default async function zipFolderProcessor(job) {
  const { jobId } = job.data

  await job.log(`Started processing job with id ${job.id}`)
  logger.info(`Job with id ${job.id}`, job.data)

  // TODO: do your CPU intense logic here
  logger.info(`Creating zip folder for ${jobId}`)
  // await processFile()

  await job.updateProgress(100)
  return "DONE"
}
