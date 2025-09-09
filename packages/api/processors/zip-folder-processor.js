import logger from "../utils/logger.js"
import path from "path"
import { zipFiles, checkFoldersExistAsync } from "../utils/file.js"
import { PROCESSED_DIR, UPLOAD_DIR, ROOT_PATH } from "../config/config.js"

export default async function zipFolderProcessor(job) {
  const { jobId } = job.data

  const processedDir = path.join(ROOT_PATH, UPLOAD_DIR, jobId, PROCESSED_DIR)

  job.log(`Started processing create zip folder job with id ${job.id}`)
  logger.info(`Started processing create zip folder job with id ${job.id}`)

  // Check if files have not been converted yet and if the zip file has already been created
  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (!convertFoldersExist.processedExists) {
      const error = new Error(
        `Files for ${jobId} have not been converted yet``Files for ${jobId} have not been converted yet`,
      )

      job.log(error.message)
      logger.error(error.message)
    }

    if (convertFoldersExist.downloadsExists) {
      const error = new Error(`Zip file for ${jobId} has already been created`)

      job.log(error.message)
      logger.error(error)
    } else {
      job.log(`Creating zip folder for ${jobId}`)
      logger.info(`Creating zip folder for ${jobId}`)

      await zipFiles(processedDir, jobId)
    }
  } catch (err) {
    const error = new Error(
      `Failed to check if zip file for ${jobId} has already been created`,
    )

    job.log(error.message)
    logger.error({
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
  }

  job.log(
    `Successfully Finished processing create zip folder job with id ${job.id}`,
  )
  logger.info(
    `Successfully Finished processing create zip folder job with id ${job.id}`,
  )
  job.updateProgress(100)
  return "DONE"
}
