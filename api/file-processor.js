import logger from "./utils/logger.js"
import { processFile } from "./services/file-service.js"

export default async function jobProcessor(job) {
  const { jobId, fileName, filePath, totalFiles, fileNumber } = job.data

  await job.log(`Started processing job with id ${job.id}`)
  logger.info(`Job with id ${job.id}`, job.data)

  // TODO: do your CPU intense logic here
  logger.info(`Processing file ${fileName}`)
  // await processFile()

  await job.updateProgress(100)
  return "DONE"
}
