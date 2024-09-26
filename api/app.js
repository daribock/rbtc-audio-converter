// import customCorsMiddleware from "./middlewares/custom-cors-middleware.js"
import cors from "cors"
import express from "express"
import fs from "fs"
import logger from "./utils/logger.js"

const PORT = process.env.PORT || 8000
const app = express()

app.use(express.json())

// Initialize Middleware
app.use(cors({ origin: "*" }))

const dest = "uploads/"

// Helper function for logging
const logRequestDetails = (req) => {
  logger.info(`Received ${req.method} request on ${req.url}`)
  logger.info(`Headers: ${JSON.stringify(req.headers)}`)
}

app.get("/", (req, res) => {
  logRequestDetails(req)
  res.send("Hello World!")
})

app.post("/", function (req, res) {
  logRequestDetails(req)
  res.send("Got a POST request")
})

app.get("/upload/status", (req, res) => {
  logRequestDetails(req)

  const uniqueFileId = String(req.headers["x-file-name"])
  const uniqueJobId = String(req.headers["x-job-id"])
  const uploadId = uniqueJobId + "_" + uniqueFileId
  const fileSize = parseInt(String(req.headers["file-size"]), 10)
  const jobDir = dest + `${uniqueJobId}/`

  if (!fs.existsSync(dest)) {
    logger.warn(`Destination folder ${dest} does not exist. Creating...`)
    fs.mkdirSync(dest)
  }

  if (!fileSize) {
    logger.error("No file-size header found in the request")
    res.status(400).send("No file-size header found")
    res.end(400)
    return
  }

  if (!uniqueFileId) {
    logger.error("No x-file-name header found in the request")
    res.status(400).send("No x-file-name header found")
    res.end(400)
    return
  }

  logger.info(
    `Checking upload status for file: ${uniqueFileId}, expected fileSize: ${fileSize}`,
  )

  if (uniqueFileId) {
    try {
      const stats = fs.statSync(jobDir + uniqueFileId)
      if (stats.isFile()) {
        if (fileSize === stats.size) {
          logger.info(`File ${uniqueFileId} is already fully uploaded.`)
          res.send({
            status: "ALREADY_UPLOADED_FILE",
            uploaded: stats.size,
          })
          return
        }
        if (!uploads[uploadId]) uploads[uploadId] = {}
        uploads[uploadId]["bytesReceived"] = stats.size
        logger.info(`File ${uniqueFileId} has ${stats.size} bytes uploaded.`)
        res.send({ uploaded: stats.size })
      }
    } catch (err) {
      const upload = uploads[uploadId]
      if (upload) {
        logger.info(
          `Resuming file upload for ${uniqueFileId}, uploaded: ${upload.bytesReceived}`,
        )
        res.send({ uploaded: upload.bytesReceived, status: "RESUMED_FILE" })
      } else {
        logger.info(`New file upload initiated for ${uniqueFileId}`)
        res.send({ uploaded: 0, status: "NEW_FILE" })
      }
    }
  }
})

let uploads = {}

app.post("/upload/files", (req, res) => {
  logRequestDetails(req)

  const uniqueFileId = String(req.headers["x-file-name"])
  const uniqueJobId = String(req.headers["x-job-id"])
  const uploadId = uniqueJobId + "_" + uniqueFileId
  const match = req.headers["content-range"].match(/(\d+)-(\d+)\/(\d+)/)
  const start = parseInt(match[1])
  const fileSize = parseInt(String(req.headers["file-size"]), 10)

  const jobDir = dest + `${uniqueJobId}`

  logger.info(
    `Received file upload request for ${uploadId}, job id is ${uniqueJobId}`,
  )

  if (!fs.existsSync(jobDir)) {
    logger.warn(`Destination folder ${dest} does not exist. Creating...`)
    fs.mkdirSync(jobDir, { recursive: true })
  }

  if (uploads[uploadId] && fileSize === uploads[uploadId].bytesReceived) {
    logger.info(
      `File ${uniqueFileId} already uploaded completely with the job ${uniqueJobId}`,
    )
    res.status(200).send("File already uploaded")
    res.end()
    return
  }

  if (!uniqueFileId) {
    logger.error("No x-file-name header found in upload/files request")
    res.status(400).send("No x-file-name header found")
    res.end(400)
    return
  }

  if (!uploads[uploadId]) uploads[uploadId] = {}
  const upload = uploads[uploadId]

  let fileStream

  if (!start) {
    upload.bytesReceived = 0
    logger.info(`Starting new file upload for ${uploadId}`)
    fileStream = fs.createWriteStream(`./${jobDir}/${uniqueFileId}`, {
      flags: "w",
    })
  } else {
    if (upload.bytesReceived != start) {
      logger.error(
        `Wrong start byte for ${uniqueFileId}. Expected: ${upload.bytesReceived}, received: ${start}`,
      )
      res.writeHead(400, "Wrong start byte")
      res.end(upload.bytesReceived)
      return
    }
    logger.info(`Resuming file upload for ${uploadId} from byte ${start}`)
    fileStream = fs.createWriteStream(`./${jobDir}/${uniqueFileId}`, {
      flags: "a",
    })
  }

  req.on("data", function (data) {
    upload.bytesReceived += data.length
  })

  req.pipe(fileStream)

  // when the request is finished, and all its data is written
  fileStream.on("close", function () {
    logger.info(`File upload complete for ${uploadId}`)
    res.status(201).send({ status: "UPLOAD_COMPLETE" })
  })

  // in case of I/O error - finish the request
  fileStream.on("error", function (_err) {
    logger.error(`File upload error for ${uploadId}: ${_err.message}`)
    res.status(500).send("File error")
    res.end()
  })
})

app.post("/upload/complete", (req, res) => {
  logRequestDetails(req)

  const uniqueFileId = String(req.headers["x-file-name"])
  const uniqueJobId = String(req.headers["x-job-id"])
  const uploadId = uniqueJobId + "_" + uniqueFileId
  delete uploads[uploadId]

  logger.info(`File upload process completed for ${uploadId}`)
  res.status(201).send({ status: "SUCCESSFULLY_UPLOADED" })
})

app.listen(PORT, () => {
  logger.info(`Example app listening at http://localhost:${PORT}`)
})
