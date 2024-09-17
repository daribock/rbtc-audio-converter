import archiver from "archiver"
import fs from "fs"

export const zipFiles = async (directory) => {
  const output = fs.createWriteStream(`${directory}.zip`)
  const archive = archiver("zip", { zlib: { level: 9 } })

  output.on("close", () => {
    console.log(`Archive created: ${archive.pointer()} total bytes`)
  })

  archive.pipe(output)
  archive.directory(directory, false)
  await archive.finalize()
}
