import "dotenv/config"
import path from "path"
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
app.set("views", ROOT_PATH + "/api/views")
app.set("view engine", "ejs")

app.use(express.json({ limit: "100mb" }))

// Initialize Middleware
app.use(helmet())

app.use(
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
app.use(ROUTES.root, downloadRoutes)
app.use(ROUTES.root, express.static(path.join(ROOT_PATH, PUBLIC_DIR)))
app.use(ROUTES.root, uploadRoutes)
app.use(ROUTES.root, convertRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info("RBTC audio converter successfully started! 🚀")
  logger.debug(`Api is listening at http://localhost:${PORT}`)
  logger.debug("For the UI, open http://localhost:8000/admin/queues")
  logger.debug("Make sure Redis is running on port 6379 by default")
})
