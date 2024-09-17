import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { zipFiles } from "../utils/file-utils.js"
import logger from "../utils/logger.js"

const execPromise = promisify(exec)

export const processFile = async (
  files,
  processedDir,
  logoPath,
  subject,
  city,
  teacher,
) => {
  try {
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true })
    }

    for (const file of files) {
      const filePath = path.resolve(file.path)
      const originalFilename = path.basename(
        file.originalname,
        path.extname(file.originalname),
      )
      const [fullYear, monthDay] = originalFilename.split("_")
      const year = fullYear.slice(2)
      const month = monthDay.slice(0, 2)
      const day = monthDay.slice(2, 4)
      const newFilename = `${year}${month}${day} ${subject} 01 ${city} ${teacher}.mp3`
      const outputPath = path.join(processedDir, newFilename)

      const command = `ffmpeg -i "${filePath}" -q:a 0 -map a "${outputPath}" && eyeD3 --add-image="${logoPath}":FRONT_COVER --artist="${teacher}" --title="${newFilename}" --album="${subject}" --track="1" --to-v2.4 "${outputPath}"`

      logger.info(`Processing file: ${file.originalname}`)
      await execPromise(command)
      logger.info(`Successfully processed file: ${file.originalname}`)

      // Delete the original file after processing
      fs.unlinkSync(filePath)
    }

    // Optionally, zip files and return the path
    await zipFiles(processedDir)
    return processedDir // Return the directory path or ZIP file path
  } catch (error) {
    logger.error(`Error processing file: ${error.message}`)
    throw error // Optionally re-throw to handle failures
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
