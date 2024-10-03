import cors from "cors"
import express from "express"
import helmet from "helmet"
import logger from "./utils/logger.js"
import errorHandler from "./middlewares/error-handler.js"
import { fileProcessorQueue } from "./queues/file-processor-queue.js"
import { FlowProducer } from "bullmq"
import { getAllFilesInDir } from "./utils/file-utils.js"
import { ExpressAdapter } from "@bull-board/express"
import { createBullBoard } from "@bull-board/api"
import uploadRoutes from "./routes/upload-routes.js"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { DEFAULT_JOB_REMOVE_CONFIG, UPLOAD_DIR } from "./config/config.js"
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

// Initialize Routes
app.use("/admin/queues", serverAdapter.getRouter())
app.use("/", uploadRoutes)

app.post("/convert/files", async (req, res, next) => {
  const uniqueJobId = req.headers["x-job-id"]

  if (!uniqueJobId) {
    const error = new Error("No x-job-id header found")
    error.status = 400
    return next(error)
  }

  const filesDir = UPLOAD_DIR + `${uniqueJobId}`

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
