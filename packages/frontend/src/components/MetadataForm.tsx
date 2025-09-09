import React from "react"
import { Form, Input } from "antd"
import { MetadataType } from "../types/types"

interface MetadataFormProps {
  metadata: MetadataType
  setMetadata: React.Dispatch<React.SetStateAction<MetadataType>>
}

const MetadataForm: React.FC<MetadataFormProps> = ({
  metadata,
  setMetadata,
}) => {
  return (
    <>
      <Form.Item
        hasFeedback
        label="Subject abbreviation (Fachkürzel)"
        name="subject"
        tooltip="Example: Spiritual Leadership = SL"
        rules={[{ required: true }]}
        validateTrigger="onBlur"
        required
      >
        <Input
          value={metadata.subject}
          onChange={(e) =>
            setMetadata({ ...metadata, subject: e.target.value })
          }
        />
      </Form.Item>
      <Form.Item
        hasFeedback
        label="City abbreviation (Stadtkürzel)"
        name="city"
        tooltip="Example: München = MN"
        rules={[{ required: true }]}
        validateTrigger="onBlur"
        required
      >
        <Input
          value={metadata.city}
          onChange={(e) => setMetadata({ ...metadata, city: e.target.value })}
        />
      </Form.Item>
      <Form.Item
        hasFeedback
        label="Teacher abbreviation (Lehrerkürzel)"
        name="teacher"
        tooltip="Example: Monika Wagner = MW"
        rules={[{ required: true }]}
        validateTrigger="onBlur"
        required
      >
        <Input
          value={metadata.teacher}
          onChange={(e) =>
            setMetadata({ ...metadata, teacher: e.target.value })
          }
        />
      </Form.Item>
      <Form.Item
        hasFeedback
        label="Email"
        name="email"
        rules={[{ type: "email" }]}
        validateDebounce={200}
        required
      >
        <Input
          value={metadata.email}
          onChange={(e) => setMetadata({ ...metadata, email: e.target.value })}
        />
      </Form.Item>
    </>
  )
}

export default MetadataForm
