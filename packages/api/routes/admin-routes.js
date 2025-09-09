import { fileProcessorQueue } from "./../queues/file-processor-queue.js"
import { ExpressAdapter } from "@bull-board/express"
import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { createZipFolderQueue } from "./../queues/create-zip-folder-queue.js"
import { sendEmailQueue } from "./../queues/send-email-queue.js"
import { cleanupQueue } from "./../queues/cleanup-queue.js"
import { ROUTES } from "../config/config.js"

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath(ROUTES.bullBoard)

createBullBoard({
  queues: [
    new BullMQAdapter(fileProcessorQueue),
    new BullMQAdapter(createZipFolderQueue),
    new BullMQAdapter(sendEmailQueue),
    new BullMQAdapter(cleanupQueue),
  ],
  serverAdapter: serverAdapter,
})

export default serverAdapter.getRouter()
