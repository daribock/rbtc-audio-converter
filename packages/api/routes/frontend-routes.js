import express from "express"
import path from "path"
import { PUBLIC_DIR, ROOT_PATH, ROUTES } from "../config/config.js"

const router = express.Router()

router.use(ROUTES.root, express.static(path.join(ROOT_PATH, PUBLIC_DIR)))

export default router
