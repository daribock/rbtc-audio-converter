import archiver from "archiver"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import {
  ROOT_PATH,
  LOGO_PATH,
  UPLOAD_DIR,
  PROCESSED_DIR,
  DOWNLOAD_DIR,
} from "../config/config.js"
import logger from "./logger.js"

export const getZipFileName = (jobId) => {
  return `converted_files_${jobId}.zip`
}

export const getFoldersByJobId = (jobId) => {
  const jobIdFolderPath = path.join(ROOT_PATH, UPLOAD_DIR, jobId)
  const processedPath = path.join(ROOT_PATH, UPLOAD_DIR, jobId, PROCESSED_DIR)
  const downloadsPath = path.join(ROOT_PATH, UPLOAD_DIR, jobId, DOWNLOAD_DIR)

  return {
    jobIdFolderPath,
    processedPath,
    downloadsPath,
  }
}

export const checkFoldersExistAsync = async (jobId) => {
  const { processedPath, downloadsPath, jobIdFolderPath } =
    getFoldersByJobId(jobId)

  const jobIdFolderExists = await fs.promises
    .access(jobIdFolderPath)
    .then(() => true)
    .catch(() => false)
  const processedExists = await fs.promises
    .access(processedPath)
    .then(() => true)
    .catch(() => false)
  const downloadsExists = await fs.promises
    .access(downloadsPath)
    .then(() => true)
    .catch(() => false)

  return {
    jobIdFolderExists,
    processedExists,
    downloadsExists,
  }
}

export const createDirectory = (path) => {
  if (!fs.existsSync(path)) {
    logger.warn(`Directory ${path} does not exist. Creating...`)
    fs.mkdirSync(path, { recursive: true })
  }
}

export const zipFiles = async (directory, jobId) => {
  const downloadDir = path.join(ROOT_PATH, UPLOAD_DIR, jobId, DOWNLOAD_DIR)
  createDirectory(downloadDir)
  const zipFilePath = path.join(downloadDir, getZipFileName(jobId))
  const output = fs.createWriteStream(zipFilePath)
  const archive = archiver("zip", { zlib: { level: 9 } })

  output.on("close", () => {
    logger.debug(`Archive created: ${archive.pointer()} total bytes`)
  })

  archive.pipe(output)
  archive.directory(directory, false)
  await archive.finalize()
}

/**
 * Get all files in a directory
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<Array>} - Promise resolving to an array of file objects with name and path
 */
export async function getAllFilesInDir(dirPath) {
  const filesArray = []

  try {
    // Read the contents of the directory
    const files = await fs.promises.readdir(dirPath)

    for (const file of files) {
      const filePath = path.join(dirPath, file)
      try {
        const stat = await fs.promises.stat(filePath)
        if (stat.isFile()) {
          filesArray.push({
            name: file,
            path: filePath,
          })
        }
      } catch (err) {
        // Log the error and stop further processing
        logger.error({
          message: `Error retrieving stats for file: ${filePath}`,
          stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
        })
        throw new Error(`Failed to retrieve file stats for: ${filePath}`)
      }
    }
  } catch (err) {
    // Log the error and stop further processing
    logger.error({
      message: `Error reading directory: ${dirPath}`,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
    throw new Error(`Failed to read directory: ${dirPath}`)
  }

  return filesArray // Return the array of file objects if no errors occurred
}

/**
 * Process a single file in the queue
 * TODO:
 * - First convert file to mp3 then set progress of job to 50%
 * - afterwards add metadata with eye3d and then when this is done update progress to 100%
 * - Process file chunk by chunk to reduce load example: https://github.com/taskforcesh/bullmq-video-transcoder/tree/main
 */
export const processFile = async (
  jobId,
  fileName,
  filePath,
  fileNumber,
  subject,
  city,
  teacher,
) => {
  try {
    const originalFilename = path.basename(fileName, path.extname(fileName))
    const [fullYear, monthDay] = originalFilename.split("_")
    const year = fullYear.slice(2)
    const month = monthDay.slice(0, 2)
    const day = monthDay.slice(2, 4)
    const trackIndex = String(fileNumber).padStart(2, "0")
    const newFilename = `${year}${month}${day} ${subject} ${trackIndex} ${city} ${teacher}.mp3`

    createDirectory(path.join(ROOT_PATH, UPLOAD_DIR, jobId, PROCESSED_DIR))
    const outputPath = path.join(
      ROOT_PATH,
      UPLOAD_DIR,
      jobId,
      PROCESSED_DIR,
      newFilename,
    )

    const command = `ffmpeg -i "${filePath}" -q:a 0 -map a "${outputPath}" && eyeD3 --add-image="${LOGO_PATH}":FRONT_COVER --artist="${teacher}" --title="${newFilename}" --album="${subject}" --track="${trackIndex}" --to-v2.4 "${outputPath}"`

    logger.debug(`Processing file: ${fileName}`)
    await new Promise((resolve, reject) => {
      exec(command, (err) => {
        if (err) {
          logger.error({
            message: `Error processing file ${fileName}`,
            stack:
              process.env.NODE_ENV === "production" ? undefined : err.stack,
          })
          reject(err)
        } else {
          logger.debug(`Successfully processed file: ${fileName}`)
          resolve()
        }
      })
    })
  } catch (err) {
    logger.error({
      message: `Error processing file for ${jobId}`,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    })
    throw err
  }
}

export const cleanupDirectories = async (directories) => {
  try {
    await Promise.all(
      directories.map(async (dir) => {
        if (fs.existsSync(dir)) {
          await fs.promises.rm(dir, { recursive: true, force: true })
        }
      }),
    )
    logger.debug("Cleanup successful")
  } catch (error) {
    logger.debug("Error during cleanup:", error)
  }
}
