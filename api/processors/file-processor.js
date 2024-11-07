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

  job.log(`Started processing file processing job with id ${job.id}`)
  logger.info(`Started processing file processing job with id ${job.id}`)

  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (convertFoldersExist.processedExists) {
      const error = new Error(`Files for ${jobId} have already been processed`)

      job.log(error.message)
      logger.error(error.message)
      await job.moveToFailed(error, "fileProcessorQueue")
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
    await job.moveToFailed(error, "fileProcessorQueue")
  }

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
