import { GetProp, UploadProps } from "antd"

export type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0]

export type UploadFileType = {
  fileId: string
  startChunk: number
  endChunk: number
  fileSize: number
}

export type FileStatesType = {
  fileId: string
  fileToUpload: FileType
  progress: number
}

export type MetadataType = {
  subject: string
  city: string
  teacher: string
  email: string
}
