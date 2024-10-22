import { fileProcessorQueue } from "./../queues/file-processor-queue.js"
import { ExpressAdapter } from "@bull-board/express"
import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { createZipFolderQueue } from "./../queues/create-zip-folder-queue.js"
import { sendEmailQueue } from "./../queues/send-email-queue.js"

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

export default serverAdapter.getRouter()
