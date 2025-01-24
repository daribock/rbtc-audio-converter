import express from "express"
import { FlowProducer } from "bullmq"
import {
  DEFAULT_JOB_REMOVE_CONFIG,
  UPLOAD_DIR,
  REDIS_CONNECTION_CONFIG,
} from "./../config/config.js"
import { checkFoldersExistAsync, getAllFilesInDir } from "../utils/file.js"
import logger from "./../utils/logger.js"

const flowProducer = new FlowProducer({ connection: REDIS_CONNECTION_CONFIG })

const router = express.Router()

router.post("/convert/files", async (req, res, next) => {
  const { jobId, subject, email, city, teacher } = req.body

  if (!jobId || !subject || !email || !city || !teacher) {
    const error = new Error("Missing required fields")
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

  await getAllFilesInDir(filesDir)
    .then(async (files) => {
      try {
        logger.debug(`Creating flow for ${jobId}`)
        const threeDayDelay = 3 * 24 * 60 * 60 * 1000 // 3 days

        await flowProducer.add(
          {
            name: `cleanup-${jobId}`,
            queueName: "cleanupQueue",
            data: { jobId },
            opts: { delay: threeDayDelay },
            children: [
              {
                name: `send-email-${jobId}`,
                queueName: "sendEmailQueue",
                data: { jobId, email },
                opts: { ignoreDependencyOnFailure: true },
                children: [
                  {
                    name: `create-zip-folder-${jobId}`,
                    queueName: "createZipFolderQueue",
                    data: { jobId },
                    opts: { failParentOnFailure: true },
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
                        opts: { failParentOnFailure: true },
                      }
                    }),
                  },
                ],
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
              cleanupQueue: {
                defaultJobOptions: { ...DEFAULT_JOB_REMOVE_CONFIG },
              },
            },
          },
        )
      } catch (err) {
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

export default router
