import path from "path"
import logger from "../utils/logger.js"
import { processFile, checkFoldersExistAsync } from "../utils/file-utils.js"
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

  job.log(`Started processing job with id ${job.id}`)
  logger.info(`Started processing job with id ${job.id}`)

  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (convertFoldersExist.processedExists) {
      job.log(`Files for ${jobId} have already been converted`)
      logger.info(`Files for ${jobId} have already been converted`)
      job.moveToFailed()
    }
  } catch (err) {
    job.log(`Failed to check if files for ${jobId} have already been converted`)
    logger.info(
      `Failed to check if files for ${jobId} have already been converted`,
    )
    job.moveToFailed()
  }

  const globalFilePath = path.join(ROOT_PATH, filePath)

  job.log(`Processing file ${fileName} from ${fileNumber}/${totalFiles}`)
  logger.info(`Processing file ${fileName} from ${fileNumber}/${totalFiles}`)
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
  job.updateProgress(100)
  return "DONE"
}
