import { useState } from 'react'
import { Form, Input, InputNumber, Modal, message } from 'antd'
import type { InvoiceServicePayload } from '@/lib/clients/invoices'

interface CreateServiceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (service: InvoiceServicePayload) => void
}

export function CreateServiceModal({ open, onClose, onSuccess }: CreateServiceModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      onSuccess({
        service_title: values.service_title,
        service_description: values.service_description || undefined,
        amount: values.amount,
      })
      form.resetFields()
    } catch {
      // validation errors are shown by Ant Design
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="Add Service"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText="Add"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="service_title"
          label="Service Title"
          rules={[{ required: true, message: 'Service title is required' }]}
        >
          <Input placeholder="Web Development Services" />
        </Form.Item>

        <Form.Item name="service_description" label="Service Description">
          <Input.TextArea rows={3} placeholder="Description of services rendered..." />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[
            { required: true, message: 'Amount is required' },
            { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
          ]}
        >
          <InputNumber className="w-full" min={0.01} step={0.01} precision={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
