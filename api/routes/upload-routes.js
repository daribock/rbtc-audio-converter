import express from "express"
import fs from "fs"
import logger from "../utils/logger.js"
import { UPLOAD_DIR } from "../config/config.js"
import { checkFoldersExistAsync, createDirectory } from "../utils/file.js"

const router = express.Router()

const validateHeaders = (req, res, next, requiredHeaders) => {
  for (const header of requiredHeaders) {
    if (!req.headers[header]) {
      const error = new Error(`No ${header} header found`)
      error.status = 400
      return next(error)
    }
  }
}

const logAndRespond = (message, status, res, additionalData = {}) => {
  logger.info(message)
  return res.status(status).send({ ...additionalData, message })
}

let uploads = {}

router.get("/upload/status", (req, res, next) => {
  const headersToValidate = ["x-file-name", "x-job-id", "file-size"]
  validateHeaders(req, res, next, headersToValidate)

  const uniqueFileId = req.headers["x-file-name"]
  const uniqueJobId = req.headers["x-job-id"]
  const uploadId = uniqueJobId + "_" + uniqueFileId
  const fileSize = parseInt(req.headers["file-size"], 10)

  createDirectory(UPLOAD_DIR)

  const jobDir = `${UPLOAD_DIR}${uniqueJobId}/`
  const filePath = jobDir + uniqueFileId

  logger.info(
    `Checking upload status for file: ${uniqueFileId}, expected fileSize: ${fileSize}`,
  )

  try {
    const stats = fs.statSync(filePath)
    if (stats.isFile()) {
      if (fileSize === stats.size) {
        return logAndRespond(
          `File ${uniqueFileId} is already fully uploaded.`,
          200,
          res,
          { status: "ALREADY_UPLOADED_FILE", uploaded: stats.size },
        )
      }
      if (!uploads[uploadId]) uploads[uploadId] = {}
      uploads[uploadId].bytesReceived = stats.size
      return logAndRespond(
        `File ${uniqueFileId} has ${stats.size} bytes uploaded.`,
        200,
        res,
        { uploaded: stats.size },
      )
    }
  } catch (err) {
    const upload = uploads[uploadId]
    if (upload) {
      return logAndRespond(
        `Resuming file upload for ${uniqueFileId}, uploaded: ${upload.bytesReceived}`,
        200,
        res,
        { uploaded: upload.bytesReceived, status: "RESUMED_FILE" },
      )
    } else {
      return logAndRespond(
        `New file upload initiated for ${uniqueFileId}`,
        200,
        res,
        { uploaded: 0, status: "NEW_FILE" },
      )
    }
  }
})

router.post("/upload/files", (req, res, next) => {
  const headersToValidate = [
    "x-file-name",
    "x-job-id",
    "content-range",
    "file-size",
  ]
  validateHeaders(req, res, next, headersToValidate)

  const uniqueFileId = req.headers["x-file-name"]
  const uniqueJobId = req.headers["x-job-id"]
  const uploadId = uniqueJobId + "_" + uniqueFileId
  const match = req.headers["content-range"].match(/(\d+)-(\d+)\/(\d+)/)
  const start = parseInt(match[1])
  const fileSize = parseInt(req.headers["file-size"], 10)

  const jobDir = `${UPLOAD_DIR}${uniqueJobId}`

  try {
    const { jobIdFolderExists } = checkFoldersExistAsync(uniqueJobId)

    if (jobIdFolderExists) {
      const error = new Error(
        `Files for ${uniqueJobId} have already been uploaded`,
      )
      error.status = 400
      return next(error)
    } else {
      createDirectory(jobDir)
    }
  } catch (err) {
    const error = new Error(`Failed to create job directory`, {
      stack: err.stack,
    })
    error.status = 400
    return next(error)
  }

  if (uploads[uploadId] && fileSize === uploads[uploadId].bytesReceived) {
    return logAndRespond(
      `File ${uniqueFileId} already uploaded completely with the job ${uniqueJobId}`,
      200,
      res,
    )
  }

  uploads[uploadId] = uploads[uploadId] || {}
  const upload = uploads[uploadId]
  const filePath = `./${jobDir}/${uniqueFileId}`
  let fileStream

  if (!start) {
    upload.bytesReceived = 0
    logger.info(`Starting new file upload for ${uploadId}`)
    fileStream = fs.createWriteStream(filePath, { flags: "w" })
  } else {
    if (upload.bytesReceived !== start) {
      logger.error(
        `Wrong start byte for ${uniqueFileId}. Expected: ${upload.bytesReceived}, received: ${start}`,
      )
      res.writeHead(400, "Wrong start byte")
      return res.end(upload.bytesReceived)
    }
    logger.info(`Resuming file upload for ${uploadId} from byte ${start}`)
    fileStream = fs.createWriteStream(filePath, { flags: "a" })
  }

  req.on("data", (data) => {
    upload.bytesReceived += data.length
  })

  req.pipe(fileStream)

  fileStream.on("close", () => {
    logAndRespond(`File upload complete for ${uploadId}`, 201, res, {
      status: "UPLOAD_COMPLETE",
    })
  })

  fileStream.on("error", (err) => {
    const error = new Error(`File upload error for ${uploadId}: ${err.message}`)
    error.status = 500
    next(error)
  })
})

router.get("/upload/complete", (req, res, next) => {
  const headersToValidate = ["x-file-name", "x-job-id"]
  validateHeaders(req, res, next, headersToValidate)

  const uniqueFileId = req.headers["x-file-name"]
  const uniqueJobId = req.headers["x-job-id"]
  const uploadId = uniqueJobId + "_" + uniqueFileId

  delete uploads[uploadId]

  logAndRespond(`File upload process completed for ${uploadId}`, 201, res, {
    status: "SUCCESSFULLY_UPLOADED",
  })
})

export default router
