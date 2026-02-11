import { useEffect, useState } from 'react'
import { Form, Input, InputNumber, Modal, message } from 'antd'
import { servicesClient } from '@/lib/clients/services'
import type { ServiceData } from '@/lib/clients/services'

interface ServiceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (service: ServiceData) => void
  service?: ServiceData | null
}

export function ServiceModal({ open, onClose, onSuccess, service }: ServiceModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!service

  useEffect(() => {
    if (open && service) {
      form.setFieldsValue({
        service_title: service.service_title,
        service_description: service.service_description,
        amount: Number(service.amount),
      })
    }
  }, [open, service, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (isEditing) {
        const updated = await servicesClient.updateService(service.id, {
          service_title: values.service_title,
          service_description: values.service_description || undefined,
          amount: values.amount,
        })
        message.success('Service updated')
        form.resetFields()
        onSuccess(updated)
      } else {
        const created = await servicesClient.createService({
          service_title: values.service_title,
          service_description: values.service_description || undefined,
          amount: values.amount,
        })
        message.success('Service created')
        form.resetFields()
        onSuccess(created)
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
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
      title={isEditing ? 'Edit Service' : 'New Service'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText={isEditing ? 'Save' : 'Create'}
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
