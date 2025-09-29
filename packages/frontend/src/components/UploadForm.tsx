import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  Upload,
  Button,
  Form,
  message,
  Progress,
  UploadProps,
  Flex,
  Card,
} from "antd"
import { UploadOutlined } from "@ant-design/icons"
import {
  convertFiles,
  uploadChunk,
  uploadComplete,
  uploadStatus,
} from "../utils/api"
import MetadataForm from "./MetadataForm"
import type {
  FileStatesType,
  FileType,
  MetadataType,
  UploadFileType,
} from "../types/types"

interface UploadFormProps {
  onUploadSuccess: () => void
}

const UploadForm = ({ onUploadSuccess }: UploadFormProps) => {
  const [error, setError] = useState<string>("")
  const [fileStates, setFileStates] = useState<FileStatesType[]>([])
  const [metadata, setMetadata] = useState<MetadataType>({
    subject: "",
    email: "",
    city: "",
    teacher: "",
  })
  const [loading, setLoading] = useState(false)
  const jobId = uuidv4()

  useEffect(() => {
    if (error !== "") {
      message.error(error)
      setLoading(false)
    }
  }, [error])

  const resetState = () => {
    setFileStates([])
    setLoading(false)
  }

  const validateMessages = {
    required: "${label} is required!",
    types: {
      email: "${label} is not a valid email!",
    },
  }

  const getFileContext = async (file: FileType) => {
    resetState()
    try {
      const fileId = file.name
      const response = await uploadStatus(jobId, fileId, file.size)
      const { data, status } = response

      if (status === 400) {
        setError(`Error in fetching file status: ${data.message}`)
        return
      }

      const uploadedBytes = data.uploaded as number
      const progress = (uploadedBytes / file.size) * 100

      setFileStates((prevState) => [
        ...prevState,
        { fileId, fileToUpload: file, progress },
      ])
    } catch (err) {
      setError("Failed to get file upload status")
    }
  }

  const handleUpload = async () => {
    setError("")
    setLoading(true)

    if (
      fileStates.length === 0 ||
      !metadata.subject ||
      !metadata.email ||
      !metadata.city ||
      !metadata.teacher
    ) {
      setError(
        "Please fill all required fields and upload at least one .wav file",
      )
      return
    }

    // Iterate through each file state and upload
    for (const { fileId, fileToUpload, progress } of fileStates) {
      if (progress !== 100) {
        await uploadFile(jobId, fileId, fileToUpload)
      }
    }

    await convertFiles(
      jobId,
      metadata.subject,
      metadata.email,
      metadata.city,
      metadata.teacher,
    )
      .then(() => {
        // Set upload success after all files are uploaded and the conversion process started
        onUploadSuccess()
      })
      .catch((err) => {
        return setError(`Converting files failed: ${err}`)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const uploadFile = async (
    jobId: string,
    fileId: string,
    fileToUpload: FileType,
  ) => {
    const chunkSize = 1 * 1024 * 1024 // 100MB
    const totalChunks = Math.ceil(fileToUpload.size / chunkSize)
    let startChunk = 0
    let totalChunksUploaded = 0
    let progress = 0

    try {
      while (totalChunksUploaded < totalChunks) {
        const { size: fileSize } = fileToUpload
        const endChunk = Math.min(startChunk + chunkSize, fileSize)
        const chunk = fileToUpload.slice(startChunk, endChunk)

        const fileUpload: UploadFileType = {
          fileId,
          startChunk,
          endChunk,
          fileSize,
        }

        // Upload the chunk
        await uploadChunk(chunk, jobId, fileUpload)

        // Update progress
        startChunk = endChunk
        totalChunksUploaded += 1
        progress = (startChunk / fileToUpload.size) * 100

        // Update the state with progress
        setFileStates((prevState) =>
          prevState.map((state) =>
            state.fileId === fileId ? { ...state, progress } : state,
          ),
        )
      }

      // Complete the upload
      await uploadComplete(jobId, fileId).then(() => {
        // Final progress update to 100%
        setFileStates((prevState) =>
          prevState.map((state) =>
            state.fileId === fileId ? { ...state, progress: 100 } : state,
          ),
        )
      })
    } catch (error) {
      console.error("Upload error:", error)
      setError(`Error in uploading file ${fileId}: ${error}`)
    }
  }

  const uploadProps: UploadProps = {
    multiple: true,
    accept: ".WAV, .mp3",
    beforeUpload: (file: FileType) => {
      getFileContext(file)
      return false
    },
    onRemove: (file) => {
      setFileStates((state) =>
        state.filter((item) => item.fileId !== file.name),
      )
    },
    fileList: fileStates.map((state) => state.fileToUpload),
    maxCount: 15,
    disabled: loading,
  }

  return (
    <Card>
      <Form
        layout="vertical"
        onFinish={handleUpload}
        validateMessages={validateMessages}
      >
        <MetadataForm metadata={metadata} setMetadata={setMetadata} />
        <Form.Item
          label="Upload WAV files"
          rules={[{ required: true }]}
          required
        >
          <Upload<FileType> {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select Files (Max: 15)</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            loading={loading}
            disabled={fileStates.length === 0}
            htmlType="submit"
          >
            Upload and convert files
          </Button>
        </Form.Item>
      </Form>

      <Flex vertical>
        {fileStates.map((file) => (
          <div key={file.fileId}>
            <Flex align="center" justify="space-between">
              <span>{file.fileToUpload.name}</span>
              <Progress percent={file.progress} type="circle" size={30} />
            </Flex>
          </div>
        ))}
      </Flex>
    </Card>
  )
}

export default UploadForm
