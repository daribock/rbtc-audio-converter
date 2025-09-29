import "dotenv/config"
import path from "path"
import process from "process"
import cors from "cors"
import fs from "fs"
import {
  ROOT_PATH,
  PUBLIC_DIR,
  ROUTES,
  PASSPORT_USER,
} from "./config/config.js"
import express from "express"
import helmet from "helmet"
import session from "express-session"
import { Strategy as LocalStrategy } from "passport-local"
import passport from "passport"
import { ensureLoggedIn } from "connect-ensure-login"
import logger from "./utils/logger.js"
import errorHandler from "./middlewares/error-handler.js"
import downloadRoutes from "./routes/download-routes.js"
import uploadRoutes from "./routes/upload-routes.js"
import convertRoutes from "./routes/convert-routes.js"
import adminRoutes from "./routes/admin-routes.js"
import healthCheckRoutes from "./routes/health-check-routes.js"

const PORT = process.env.PORT || 8000

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(
  new LocalStrategy(function (username, password, cb) {
    if (
      username === PASSPORT_USER.username &&
      password === PASSPORT_USER.password
    ) {
      return cb(null, { user: PASSPORT_USER.user })
    }
    return cb(null, false)
  }),
)

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => {
  cb(null, user)
})

passport.deserializeUser((user, cb) => {
  cb(null, user)
})

const app = express()

// Configure view engine to render EJS templates.
app.set("views", ROOT_PATH + "/views")

// Apply CORS only in development
if (process.env.NODE_ENV !== "production") {
  const corsOptions = {
    origin: "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "x-file-name",
      "x-job-id",
      "content-range",
      "file-size",
    ],
  }

  app.use(cors(corsOptions))
  logger.debug("CORS enabled for development")
}

app.set("view engine", "ejs")

app.use(express.json({ limit: "100mb" }))

// Initialize Middleware
app.use(helmet())

app.use(
  // cspell:disable-next-line
  session({ secret: "keyboard cat", saveUninitialized: true, resave: true }),
)

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize({}))
app.use(passport.session({}))

app.get(ROUTES.login, (req, res) => {
  res.render("login", { invalid: req.query.invalid === "true" })
})

app.post(
  ROUTES.login,
  express.urlencoded({ extended: false }),
  passport.authenticate("local", {
    successRedirect: ROUTES.bullBoard,
    failureRedirect: "/admin/login?invalid=true",
  }),
  (req, res) => {
    res.redirect(ROUTES.bullBoard)
  },
)

// Initialize Routes
app.use(
  ROUTES.bullBoard,
  ensureLoggedIn({ redirectTo: ROUTES.login }),
  adminRoutes,
)

// API Routes
app.use(ROUTES.root, downloadRoutes)
app.use(ROUTES.root, uploadRoutes)
app.use(ROUTES.root, convertRoutes)
app.use("/api/health", healthCheckRoutes)

// Serve static files from the React app build directory
app.use(express.static(path.join(ROOT_PATH, PUBLIC_DIR)))

// Catch all handler: send back React's index.html file for SPA routing
app.get("*", (req, res) => {
  // Don't serve index.html for API routes or admin routes
  if (
    req.path.startsWith("/admin") ||
    req.path.startsWith("/api") ||
    req.path.startsWith("/upload") ||
    req.path.startsWith("/download") ||
    req.path.startsWith("/convert")
  ) {
    return res.status(404).json({ error: "API endpoint not found" })
  }

  const indexPath = path.join(ROOT_PATH, PUBLIC_DIR, "index.html")
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send("Frontend not built. Run: npm run build:frontend")
  }
})

app.use(errorHandler)

// Initialize Redis infrastructure and start server
export async function startServer() {
  try {
    // Start the Express server
    app.listen(PORT, () => {
      logger.info("RBTC audio converter successfully started! 🚀")
      logger.debug(`Api is listening at http://localhost:${PORT}`)
      logger.debug("For the UI, open http://localhost:8000/admin/queues")

      if (process.env.NODE_ENV === "production") {
        logger.debug("Production mode: Make sure Redis is running externally")
      } else {
        logger.debug("Development mode: Redis container auto-managed")
      }
    })
  } catch (error) {
    logger.error("Failed to start server:", error.message)

    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...")
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...")
  process.exit(0)
})
