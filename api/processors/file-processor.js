import path from "path"
import logger from "../utils/logger.js"
import { processFile } from "../utils/file-utils.js"
import { ROOT_PATH } from "../config/config.js"

export default async function fileProcessor(job) {
  const {
    jobId,
    fileName,
    filePath,
    totalFiles,
    fileNumber,
    subject,
    city,
    teacher,
  } = job.data

  await job.log(`Started processing job with id ${job.id}`)
  logger.info(`Started processing job with id ${job.id}`, job.data)

  const globalFilePath = path.join(ROOT_PATH, filePath)

  job.log(`Processing file ${fileName} from ${fileNumber}/${totalFiles}`)
  // TODO: Build in step by step logging
  await processFile(
    jobId,
    fileName,
    globalFilePath,
    fileNumber,
    subject,
    city,
    teacher,
  )

  job.log(`Processing DONE`)
  await job.updateProgress(100)
  return "DONE"
}
