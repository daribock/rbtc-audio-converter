import path from "path"
import { exec } from "child_process"
import logger from "../utils/logger.js"
import { LOGO_PATH } from "../config/config.js"

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
