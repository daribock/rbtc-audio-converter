const express = require("express")
const fileUpload = require("express-fileupload")
const path = require("path")
const cors = require("cors")
const fs = require("fs")
const { exec } = require("child_process")
const archiver = require("archiver")
const process = require("process")
const { v4: uuidv4 } = require("uuid") // Unique IDs for each request
const healthCheckController = require("./controller/health-check-controller")

const app = express()
const PORT = process.env.PORT || 5000
const URL = process.env.URL || "http://localhost:5173"

app.use(fileUpload())
app.use(
  cors({
    origin: URL,
    methods: ["POST"],
  }),
)

app.use("/.well-known", healthCheckController())

// Serve static files from the Vite build directory
app.use("/", express.static(path.join(__dirname, "../client/dist")))

app.post("/api/upload", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.")
    }

    const files = req.files.files
    const subject = req.body.subject
    const city = req.body.city
    const teacher = req.body.teacher

    if (!subject || !city || !teacher) {
      return res.status(400).send("Missing required fields.")
    }

    // Ensure files are in an array
    const filesArray = Array.isArray(files) ? files : [files]

    const requestId = uuidv4() // Unique request ID
    const logoPath = path.join(__dirname, "logo.jpg")

    // Unique directories for each request
    const uploadDir = path.join(__dirname, `uploads_${requestId}`)
    const processedDir = path.join(__dirname, `processed_${requestId}`)
    const downloadDir = path.join(__dirname, `downloads_${requestId}`)

    await createDirectories([uploadDir, processedDir, downloadDir])

    // Save files to the upload directory
    await Promise.all(
      filesArray.map((file) => file.mv(path.join(uploadDir, file.name))),
    )

    // Process each file
    const processedFiles = await processFiles(
      filesArray,
      uploadDir,
      processedDir,
      logoPath,
      subject,
      city,
      teacher,
    )

    // Create a zip file with the processed files
    const zipFilePath = await createZipFile(processedFiles, downloadDir)

    // Send the zip file to the client
    res.download(zipFilePath, "converted_files.zip", async (err) => {
      if (err) {
        console.error("Error downloading the file:", err)
        // Clean up directories even on download error
        await cleanupDirectories([uploadDir, processedDir, downloadDir])
        // Avoid attempting to send another response
        return res.status(500).send("Error downloading the file")
      }

      // Clean up directories after successful download
      await cleanupDirectories([uploadDir, processedDir, downloadDir])
    })
  } catch (error) {
    console.error("Error processing the upload:", error)
    // If an error occurs and no response has been sent yet, send a response
    if (!res.headersSent) {
      return res.status(500).send("Internal Server Error")
    }
    // If headers are already sent, log the error and avoid sending another response
  }
})

const createDirectories = async (directories) => {
  return Promise.all(
    directories.map((dir) => {
      if (!fs.existsSync(dir)) {
        return fs.promises.mkdir(dir)
      }
    }),
  )
}

const processFiles = (
  filesArray,
  uploadDir,
  processedDir,
  logoPath,
  subject,
  city,
  teacher,
) => {
  return Promise.all(
    filesArray.map((file, index) => {
      return new Promise((resolve, reject) => {
        const filePath = path.join(uploadDir, file.name)

        const originalFilename = path.basename(
          file.name,
          path.extname(file.name),
        )
        const [fullYear, monthDay] = originalFilename.split("_")
        const year = fullYear.slice(2)
        const month = monthDay.slice(0, 2)
        const day = monthDay.slice(2, 4)
        const trackIndex = String(index + 1).padStart(2, "0")

        const newFilename = `${year}${month}${day} ${subject} ${trackIndex} ${city} ${teacher}.mp3`
        const outputPath = path.join(processedDir, newFilename)

        const command = `ffmpeg -i "${filePath}" -q:a 0 -map a "${outputPath}" && eyeD3 --add-image="${logoPath}":FRONT_COVER --artist="${teacher}" --title="${newFilename}" --album="${subject}" --track="${index + 1}" --to-v2.4 "${outputPath}"`

        exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing command: ${stderr}`)
            return reject(error)
          }

          console.log(`Command output: ${stdout}`)
          resolve(outputPath)
        })
      })
    }),
  )
}

const createZipFile = (processedFiles, downloadDir) => {
  return new Promise((resolve, reject) => {
    const zipFilePath = path.join(downloadDir, "converted_files.zip")
    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    output.on("close", () => resolve(zipFilePath))
    archive.on("error", (err) => reject(err))

    archive.pipe(output)
    processedFiles.forEach((file) =>
      archive.file(file, { name: path.basename(file) }),
    )
    archive.finalize()
  })
}

const cleanupDirectories = async (directories) => {
  return Promise.all(
    directories.map((dir) =>
      fs.promises.rm(dir, { recursive: true, force: true }),
    ),
  )
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
