// import logger from "../utils/logger"

const errorHandler = (err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Internal Server Error" })
}

export default errorHandler
