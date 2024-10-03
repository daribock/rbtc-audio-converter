import archiver from "archiver"
import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { LOGO_PATH } from "../config/config.js"
import logger from "./logger.js"

export const zipFiles = async (directory) => {
  const output = fs.createWriteStream(`${directory}.zip`)
  const archive = archiver("zip", { zlib: { level: 9 } })

  output.on("close", () => {
    logger.info(`Archive created: ${archive.pointer()} total bytes`)
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
        logger.error(
          `Error retrieving stats for file: ${filePath}`,
          err.message,
        )
        throw new Error(`Failed to retrieve file stats for: ${filePath}`)
      }
    }
  } catch (err) {
    // Log the error and stop further processing
    logger.error(`Error reading directory: ${dirPath}`, err.message)
    throw new Error(`Failed to read directory: ${dirPath}`)
  }

  return filesArray // Return the array of file objects if no errors occurred
}

export const processFile = async (
  fileName,
  filePath,
  fileNumber,
  processedDir,
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
    const outputPath = path.join(processedDir, newFilename)

    const command = `ffmpeg -i "${filePath}" -q:a 0 -map a "${outputPath}" && eyeD3 --add-image="${LOGO_PATH}":FRONT_COVER --artist="${teacher}" --title="${newFilename}" --album="${subject}" --track="1" --to-v2.4 "${outputPath}"`

    logger.info(`Processing file: ${fileName}`)
    await new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          logger.error(`Error processing file ${fileName}: ${error}`)
          reject(error)
        } else {
          logger.info(`Successfully processed file: ${fileName}`)
          resolve()
        }
      })
    })
  } catch (error) {
    logger.error("Error processing file:", fileName, error)
    throw error
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
    logger.info("Cleanup successful")
  } catch (error) {
    logger.error("Error during cleanup:", error)
  }
}
