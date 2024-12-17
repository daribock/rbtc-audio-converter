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

  job.log(`Started processing file processing job with id ${job.id}`)
  logger.info(`Started processing file processing job with id ${job.id}`)

  const globalFilePath = path.join(ROOT_PATH, filePath)

  // TODO: Build in step by step logging for processFile
  job.log(
    `Processing file ${fileName} from ${fileNumber}/${totalFiles} for ${jobId}`,
  )
  logger.info(
    `Processing file ${fileName} from ${fileNumber}/${totalFiles} for ${jobId}`,
  )
  await processFile(
    jobId,
    fileName,
    globalFilePath,
    fileNumber,
    subject,
    city,
    teacher,
  )

  job.log(
    `Successfully finished processing file processing job with id ${job.id}`,
  )
  logger.info(
    `Successfully finished processing file processing job with id ${job.id}`,
  )
  job.updateProgress(100)
  return "DONE"
}
