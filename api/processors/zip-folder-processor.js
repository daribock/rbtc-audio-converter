import logger from "../utils/logger.js"
import path from "path"
import { zipFiles, checkFoldersExistAsync } from "../utils/file-utils.js"
import { PROCESSED_DIR, UPLOAD_DIR, ROOT_PATH } from "../config/config.js"

export default async function zipFolderProcessor(job) {
  const { jobId } = job.data

  const processedDir = path.join(ROOT_PATH, UPLOAD_DIR, jobId, PROCESSED_DIR)

  job.log(`Started processing job with id ${job.id}`)
  logger.info(`Job with id ${job.id}`, job.data)

  // Check if files have not been converted yet and if the zip file has already been created
  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (!convertFoldersExist.processedExists) {
      job.log(`Files for ${jobId} have not been converted yet`)
      logger.info(`Files for ${jobId} have not been converted yet`)
      job.moveToFailed()
    }

    if (convertFoldersExist.downloadsExists) {
      job.log(`Zip file for ${jobId} has already been created`)
      logger.info(`Zip file for ${jobId} has already been created`)
      job.moveToFailed()
    }
  } catch (err) {
    job.log(`Failed to check if Zip file for ${jobId} has already been created`)
    logger.info(
      `Failed to check if Zip file for ${jobId} has already been created`,
    )
    job.moveToFailed()
  }

  job.log(`Creating zip folder for ${jobId}`)
  logger.info(`Creating zip folder for ${jobId}`)
  await zipFiles(processedDir, jobId)

  job.log(`Processing DONE`)
  job.updateProgress(100)
  return "DONE"
}
