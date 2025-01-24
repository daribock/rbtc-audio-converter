import "dotenv/config"
import path from "path"
import { ROOT_PATH, PUBLIC_DIR } from "./config/config.js"
import express from "express"
import helmet from "helmet"
import logger from "./utils/logger.js"
import errorHandler from "./middlewares/error-handler.js"
import downloadRoutes from "./routes/download-routes.js"
import uploadRoutes from "./routes/upload-routes.js"
import convertRoutes from "./routes/convert-routes.js"
import adminRoutes from "./routes/admin-routes.js"

const PORT = process.env.PORT || 8000

const app = express()

app.use(express.json())

// Initialize Middleware
app.use(helmet())

// Initialize Routes
app.use("/admin/queues", adminRoutes)
app.use("/", downloadRoutes)
app.use("/", express.static(path.join(ROOT_PATH, PUBLIC_DIR)))
app.use("/", uploadRoutes)
app.use("/", convertRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info("RBTC audio converter successfully started! 🚀")
  logger.debug(`Api is listening at http://localhost:${PORT}`)
  logger.debug("For the UI, open http://localhost:8000/admin/queues")
  logger.debug("Make sure Redis is running on port 6379 by default")
})
