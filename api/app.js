import "dotenv/config"
import cors from "cors"
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
app.use(cors({ origin: "*" }))
app.use(helmet())

// Initialize Routes
app.use("/admin/queues", adminRoutes)
app.use("/", downloadRoutes)
app.use("/", uploadRoutes)
app.use("/", convertRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Example app listening at http://localhost:${PORT}`)
  logger.info("For the UI, open http://localhost:8000/admin/queues")
  logger.info("Make sure Redis is running on port 6379 by default")
})
