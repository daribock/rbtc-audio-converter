import "dotenv/config"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import logger from "./utils/logger.js"
import errorHandler from "./middlewares/error-handler.js"
import { fileProcessorQueue } from "./queues/file-processor-queue.js"
import { FlowProducer } from "bullmq"
import { checkFoldersExistAsync, getAllFilesInDir } from "./utils/file-utils.js"
import { ExpressAdapter } from "@bull-board/express"
import { createBullBoard } from "@bull-board/api"
import downloadRoutes from "./routes/download-routes.js"
import uploadRoutes from "./routes/upload-routes.js"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { DEFAULT_JOB_REMOVE_CONFIG, UPLOAD_DIR } from "./config/config.js"
import { createZipFolderQueue } from "./queues/create-zip-folder-queue.js"
import { sendEmailQueue } from "./queues/send-email-queue.js"

const PORT = process.env.PORT || 8000

const flowProducer = new FlowProducer()

const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [
    new BullMQAdapter(fileProcessorQueue),
    new BullMQAdapter(createZipFolderQueue),
    new BullMQAdapter(sendEmailQueue),
  ],
  serverAdapter: serverAdapter,
})
serverAdapter.setBasePath("/admin/queues")

const app = express()

app.use(express.json())

// Initialize Middleware
app.use(cors({ origin: "*" }))
app.use(helmet())

// Initialize Routes
app.use("/admin/queues", serverAdapter.getRouter())
app.use("/", downloadRoutes)
app.use("/", uploadRoutes)

app.post("/convert/files", async (req, res, next) => {
  const { jobId, subject, email, city, teacher } = req.body

  if (!jobId || !subject || !email || !city || !teacher) {
    const error = new Error("Missing required fields in body")
    error.status = 400
    return next(error)
  }

  try {
    const convertFoldersExist = await checkFoldersExistAsync(jobId)

    if (
      convertFoldersExist.downloadsExists ||
      convertFoldersExist.processedExists
    ) {
      const error = new Error(`Files for this job have already been converted`)
      error.status = 423
      return next(error)
    }
  } catch (err) {
    const error = new Error(`Something went wrong: ${err}`)
    error.status = 500
    return next(error)
  }

  const filesDir = UPLOAD_DIR + `${jobId}`

  // TODO: Add one additional que to send email to the user
  await getAllFilesInDir(filesDir)
    .then(async (files) => {
      try {
        logger.info("Creating flow")

        await flowProducer.add(
          {
            name: `send-email-${jobId}`,
            queueName: "sendEmailQueue",
            data: { jobId, email },
            children: [
              {
                name: `create-zip-folder-${jobId}`,
                queueName: "createZipFolderQueue",
                data: { jobId },
                children: files.map((file) => {
                  return {
                    name: `process-file-${jobId}`,
                    queueName: "fileProcessorQueue",
                    data: {
                      subject,
                      city,
                      teacher,
                      jobId: jobId,
                      fileName: file.name,
                      filePath: file.path,
                      totalFiles: files.length,
                      fileNumber: files.indexOf(file) + 1,
                    },
                  }
                }),
              },
            ],
          },
          {
            queuesOptions: {
              sendEmailQueue: {
                defaultJobOptions: { ...DEFAULT_JOB_REMOVE_CONFIG },
              },
              createZipFolderQueue: {
                defaultJobOptions: { ...DEFAULT_JOB_REMOVE_CONFIG },
              },
              fileProcessorQueue: {
                defaultJobOptions: { ...DEFAULT_JOB_REMOVE_CONFIG },
              },
            },
          },
        )
      } catch (err) {
        logger.error(err)
        const error = new Error(`Failed to convert files for the job: ${jobId}`)
        error.status = 400
        return next(error)
      }

      res.status(200).send({ status: "FILE_PROCESS_STARTED" })
      return next()
    })
    .catch(() => {
      const error = new Error(`No files uploaded for the job: ${jobId}`)
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
