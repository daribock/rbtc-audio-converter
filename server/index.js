import express from "express"
import fileUpload from "express-fileupload"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import { exec } from "child_process"
import archiver from "archiver"
import { v4 as uuidv4 } from "uuid"
import healthCheckController from "./controller/health-check-controller.js"
import customCorsMiddleware from "./middleware/custom-cors-middleware.js"
import logger from "./logger/logger.js"

let isProcessing = false

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Initialize Middleware
app.use(customCorsMiddleware)
app.use(fileUpload())

app.use("/.well-known", healthCheckController())

app.post("/api/upload", async (req, res) => {
  const requestId = uuidv4() // Unique request ID
  logger.info(`Request ${requestId} received`)

  // Check if another file is being processed
  if (isProcessing) {
    logger.info(
      `Request ${requestId} was blocked because another file conversion is in progress`,
    )
    return res
      .status(429)
      .send("Another file conversion is in progress. Please wait")
  }

  isProcessing = true // Acquire the lock
  const logoPath = path.join(__dirname, "logo.jpg")

  // Unique directories for each request
  const uploadDir = path.join(__dirname, `uploads_${requestId}`)
  const processedDir = path.join(__dirname, `processed_${requestId}`)
  const downloadDir = path.join(__dirname, `downloads_${requestId}`)

  const startTime = Date.now()

  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      logger.warn(`Request ${requestId} failed: No files were uploaded`)
      return res.status(400).send("No files were uploaded.")
    }

    const file = req.files.file

    if (!file || Array.isArray(file)) {
      logger.warn(`Request ${requestId} failed: Expected exactly one file`)
      return res.status(400).send("Expected exactly one file.")
    }

    const subject = req.body.subject
    const city = req.body.city
    const teacher = req.body.teacher

    if (!subject || !city || !teacher) {
      logger.warn(`Request ${requestId} failed: Missing required fields`)
      return res.status(400).send("Missing required fields.")
    }

    // Ensure directories exist
    logger.info(`Request ${requestId} creating directories`)
    await createDirectories([uploadDir, processedDir, downloadDir])

    // Save the file to the upload directory
    logger.info(`Request ${requestId} saving file to upload directory`)
    const filePath = path.join(uploadDir, file.name)
    await file.mv(filePath)

    // Process the file
    logger.info(`Request ${requestId} processing file`)
    const processedFile = await processFile(
      file,
      filePath,
      processedDir,
      logoPath,
      subject,
      city,
      teacher,
    )

    // Create a zip file with the processed file
    logger.info(`Request ${requestId} creating zip file`)
    const zipFilePath = await createZipFile(
      [processedFile],
      downloadDir,
      requestId,
    )

    // Send the zip file to the client
    res.download(
      zipFilePath,
      `converted_file_process_${requestId}.zip`,
      (err) => {
        if (err) {
          logger.error(
            `Request ${requestId} error downloading the file: ${err}`,
          )
        }
      },
    )
  } catch (error) {
    logger.error(`Request ${requestId} error: ${error}`)

    // Check if headers are already sent
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error")
    }
  } finally {
    const endTime = Date.now()
    const durationMs = endTime - startTime

    const durationMin = Math.floor(durationMs / 60000) // Full minutes
    const durationSec = ((durationMs % 60000) / 1000).toFixed(2) // Remaining seconds

    logger.info(
      `Request ${requestId} completed. Processing time: ${durationMin} minutes and ${durationSec} seconds`,
    )

    // Cleanup directories after processing is complete, regardless of success or failure
    await cleanupDirectories([uploadDir, processedDir, downloadDir])

    // Release the lock
    isProcessing = false
  }
})

const createDirectories = async (directories) => {
  return Promise.all(
    directories.map(async (dir) => {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir)
      }
    }),
  )
}

const processFile = async (
  file,
  filePath,
  processedDir,
  logoPath,
  subject,
  city,
  teacher,
) => {
  try {
    const originalFilename = path.basename(file.name, path.extname(file.name))
    const [fullYear, monthDay] = originalFilename.split("_")
    const year = fullYear.slice(2)
    const month = monthDay.slice(0, 2)
    const day = monthDay.slice(2, 4)
    const newFilename = `${year}${month}${day} ${subject} 01 ${city} ${teacher}.mp3` // Track index is always '01'
    const outputPath = path.join(processedDir, newFilename)

    const command = `ffmpeg -i "${filePath}" -q:a 0 -map a "${outputPath}" && eyeD3 --add-image="${logoPath}":FRONT_COVER --artist="${teacher}" --title="${newFilename}" --album="${subject}" --track="1" --to-v2.4 "${outputPath}"`

    logger.info(`Processing file: ${file.name}`)
    await new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          logger.error(`Error processing file ${file.name}: ${error}`)
          reject(error)
        } else {
          logger.info(`Successfully processed file: ${file.name}`)
          resolve()
        }
      })
    })

    return outputPath
  } catch (error) {
    console.error("Error processing file:", file.name, error)
    throw error // Optionally re-throw to stop processing further files
  }
}

const createZipFile = (processedFiles, downloadDir, requestId) => {
  return new Promise((resolve, reject) => {
    const zipFilePath = path.join(
      downloadDir,
      `converted_file_process_${requestId}.zip`,
    )
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    output.on("close", () => resolve(zipFilePath))
    archive.on("error", (err) => reject(err))

    archive.pipe(output)
    processedFiles.forEach((file) =>
      archive.file(file, { name: path.basename(file) }),
    )
    archive.finalize()
  })
}

const cleanupDirectories = async (directories) => {
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

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
})
