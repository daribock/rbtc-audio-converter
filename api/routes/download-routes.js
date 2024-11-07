import express from "express"
import fileController from "../controllers/file-controller.js"

const router = express.Router()

// TODO: convert to post and only allow if correct password is provided that the user got via mail OR add the password automatically in the link
router.get("/download/:jobId/:fileName", fileController.getDownloadLink)

export default router
