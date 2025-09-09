import { useState } from "react"
import { Button, Card, Result } from "antd"
import UploadForm from "./UploadForm"

export const Content = () => {
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false)
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false)

  if (showUploadForm) {
    return (
      <UploadForm
        onUploadSuccess={() => {
          setUploadSuccess(true)
          setShowUploadForm(false)
        }}
      />
    )
  }

  if (uploadSuccess) {
    return (
      <Card>
        <Result
          status="success"
          title="Files successfully uploaded!"
          subTitle="The convert process has started now. After your files have been successfully converted, a link will be sent to you to download the converted files."
          extra={[
            <Button
              type="primary"
              onClick={() => {
                setUploadSuccess(false)
                setShowUploadForm(false)
              }}
            >
              Upload other files
            </Button>,
          ]}
        />
      </Card>
    )
  }

  return (
    <Button size="large" type="primary" onClick={() => setShowUploadForm(true)}>
      Start converting
    </Button>
  )
}
