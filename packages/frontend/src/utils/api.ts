import axios from "axios"
import type { UploadFileType } from "../types/types"

const baseURL = import.meta.env.VITE_API_URL || ""

// Create an axios instance with default config
const api = axios.create({ baseURL })

export const uploadStatus = (
  jobId: string,
  fileId: string,
  fileSize: number,
) => {
  return api.get("/upload/status", {
    headers: {
      "x-job-id": jobId,
      "x-file-name": fileId,
      "file-size": fileSize,
    },
  })
}

export const uploadComplete = (jobId: string, fileId: string) => {
  return api.get("/upload/complete", {
    headers: {
      "x-job-id": jobId,
      "x-file-name": fileId,
    },
  })
}

export const uploadChunk = (
  chunk: Blob,
  jobId: string,
  fileState: UploadFileType,
) => {
  const { fileId, startChunk, endChunk, fileSize } = fileState

  return api.post("/upload/files", chunk, {
    headers: {
      "x-job-id": jobId,
      "x-file-name": fileId,
      "Content-Range": `bytes ${startChunk}-${endChunk}/${fileSize}`,
      "file-size": fileSize,
    },
  })
}

export const convertFiles = (
  jobId: string,
  subject: string,
  email: string,
  city: string,
  teacher: string,
) => {
  const payload = { jobId, subject, email, city, teacher }

  return api.post("/convert/files", payload)
}
