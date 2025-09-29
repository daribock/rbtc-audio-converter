import { ROOT_PATH, UPLOAD_DIR, DOWNLOAD_DIR } from "../config/config.js"
import path from "path"

const getDownloadLink = (req, res, next) => {
  // Extracting the file name from the request URL
  const fileName = req.params.fileName
  const jobId = req.params.jobId
  const filePath = path.join(
    ROOT_PATH,
    UPLOAD_DIR,
    jobId,
    DOWNLOAD_DIR,
    fileName,
  )

  res.download(filePath, (err) => {
    if (err) {
      const error = new Error(`Error downloading file`)
      error.status = 500
      return next(error)
    }
  })
}

export default { getDownloadLink }
