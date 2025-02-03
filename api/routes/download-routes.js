import express from "express"
import fileController from "../controllers/file-controller.js"
import { ROUTES } from "../config/config.js"

const router = express.Router()

// TODO: convert to post and only allow if correct password is provided that the user got via mail OR add the password automatically in the link
router.get(ROUTES.downloadJobFiles, fileController.getDownloadLink)

export default router
