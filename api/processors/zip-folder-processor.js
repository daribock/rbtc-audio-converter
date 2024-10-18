import logger from "../utils/logger.js"
import path from "path"
import { zipFiles } from "../utils/file-utils.js"
import { PROCESSED_DIR, UPLOAD_DIR, ROOT_PATH } from "../config/config.js"

export default async function zipFolderProcessor(job) {
  const { jobId } = job.data

  const processedDir = path.join(ROOT_PATH, UPLOAD_DIR, jobId, PROCESSED_DIR)

  await job.log(`Started processing job with id ${job.id}`)
  logger.info(`Job with id ${job.id}`, job.data)

  logger.info(`Creating zip folder for ${jobId}`)
  await zipFiles(processedDir, jobId)

  await job.updateProgress(100)
  return "DONE"
}
