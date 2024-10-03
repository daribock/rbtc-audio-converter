import cors from "cors"
import express from "express"
import helmet from "helmet"
import fs from "fs"
import logger from "./utils/logger.js"
import errorHandler from "./middlewares/error-handler.js"
import { fileProcessorQueue } from "./queues/file-processor-queue.js"
import { FlowProducer } from "bullmq"
import { getAllFilesInDir } from "./utils/file-utils.js"
import { ExpressAdapter } from "@bull-board/express"
import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { DEFAULT_JOB_REMOVE_CONFIG } from "./config/config.js"
import { createZipFolderQueue } from "./queues/create-zip-folder-queue.js"

const PORT = process.env.PORT || 8000

const flowProducer = new FlowProducer()

const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [
    new BullMQAdapter(fileProcessorQueue),
    new BullMQAdapter(createZipFolderQueue),
  ],
  serverAdapter: serverAdapter,
})
serverAdapter.setBasePath("/admin/queues")

const app = express()

app.use(express.json())

// Initialize Middleware
app.use(cors({ origin: "*" }))
app.use(helmet())
app.use("/admin/queues", serverAdapter.getRouter())

const dest = "uploads/"

// Helper function for logging
const logRequestDetails = (req) => {
  logger.info(`Received ${req.method} request on ${req.url}`)
  logger.info(`Headers: ${JSON.stringify(req.headers)}`)
}

app.get("/", (req, res) => {
  logRequestDetails(req)
  return res.send("Hello World!")
})

app.post("/", function (req, res) {
  logRequestDetails(req)
  return res.send("Got a POST request")
})

app.get("/upload/status", (req, res, next) => {
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
    const error = new Error("No file-size header found")
    error.status = 400
    return next(error)
  }

  if (!uniqueFileId) {
    const error = new Error("No x-file-name header found")
    error.status = 400
    return next(error)
  }

  if (!uniqueJobId) {
    const error = new Error("No x-job-id header found")
    error.status = 400
    return next(error)
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
          return res.send({
            status: "ALREADY_UPLOADED_FILE",
            uploaded: stats.size,
          })
        }
        if (!uploads[uploadId]) uploads[uploadId] = {}
        uploads[uploadId]["bytesReceived"] = stats.size
        logger.info(`File ${uniqueFileId} has ${stats.size} bytes uploaded.`)
        return res.send({ uploaded: stats.size })
      }
    } catch (err) {
      const upload = uploads[uploadId]
      if (upload) {
        logger.info(
          `Resuming file upload for ${uniqueFileId}, uploaded: ${upload.bytesReceived}`,
        )
        return res.send({
          uploaded: upload.bytesReceived,
          status: "RESUMED_FILE",
        })
      } else {
        logger.info(`New file upload initiated for ${uniqueFileId}`)
        return res.send({ uploaded: 0, status: "NEW_FILE" })
      }
    }
  }
})

let uploads = {}

app.post("/upload/files", (req, res, next) => {
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
    return res.status(200).send("File already uploaded")
  }

  if (!uniqueFileId) {
    const error = new Error(`No x-file-name header found`)
    error.status = 400
    return next(error)
  }

  if (!uniqueJobId) {
    const error = new Error("No x-job-id header found")
    error.status = 400
    return next(error)
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
    return res.status(201).send({ status: "UPLOAD_COMPLETE" })
  })

  // in case of I/O error - finish the request
  fileStream.on("error", function (_err) {
    const error = new Error(
      `File upload error for ${uploadId}: ${_err.message}`,
    )
    error.status = 500
    return next(error)
  })
})

app.post("/upload/complete", (req, res, next) => {
  logRequestDetails(req)

  const uniqueFileId = String(req.headers["x-file-name"])
  const uniqueJobId = String(req.headers["x-job-id"])

  if (!uniqueFileId) {
    const error = new Error(`No x-file-name header found`)
    error.status = 400
    return next(error)
  }

  if (!uniqueJobId) {
    const error = new Error("No x-job-id header found")
    error.status = 400
    return next(error)
  }

  const uploadId = uniqueJobId + "_" + uniqueFileId
  delete uploads[uploadId]

  logger.info(`File upload process completed for ${uploadId}`)
  return res.status(201).send({ status: "SUCCESSFULLY_UPLOADED" })
})

app.post("/convert/files", async (req, res, next) => {
  const uniqueJobId = String(req.headers["x-job-id"])

  if (!uniqueJobId) {
    const error = new Error("No x-job-id header found")
    error.status = 400
    return next(error)
  }

  const filesDir = dest + `${uniqueJobId}`

  await getAllFilesInDir(filesDir)
    .then(async (files) => {
      try {
        logger.info("Creating flow")
        await flowProducer.add({
          name: "create-zip-folder",
          queueName: "createZipFolderQueue",
          children: files.map((file) => {
            return {
              name: "processFile",
              queueName: "fileProcessorQueue",
              data: {
                jobId: uniqueJobId,
                fileName: file.name,
                filePath: file.path,
                totalFiles: files.length,
                fileNumber: files.indexOf(file) + 1,
              },
              ...DEFAULT_JOB_REMOVE_CONFIG,
            }
          }),
        })
      } catch (err) {
        const error = new Error(
          `Failed to add job to file processor queue: ${uniqueJobId}`,
        )
        error.status = 400
        return next(error)
      }

      res.status(200).send({ status: "FILE_PROCESS_STARTED" })
      return next()
    })
    .catch(() => {
      const error = new Error(`No files uploaded for the job: ${uniqueJobId}`)
      error.status = 400
      return next(error)
    })
})

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Example app listening at http://localhost:${PORT}`)
  logger.info("For the UI, open http://localhost:8000/admin/queues")
  logger.info("Make sure Redis is running on port 6379 by default")
})
