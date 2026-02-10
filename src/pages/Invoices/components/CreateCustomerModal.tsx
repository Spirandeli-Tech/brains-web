import { useState } from 'react'
import { Form, Input, Modal, message } from 'antd'
import { customersClient } from '@/lib/clients/customers'
import type { CustomerData } from '@/lib/clients/customers'

interface CreateCustomerModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (customer: CustomerData) => void
}

export function CreateCustomerModal({ open, onClose, onSuccess }: CreateCustomerModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const customer = await customersClient.createCustomer(values)
      message.success('Customer created')
      form.resetFields()
      onSuccess(customer)
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
      title="New Customer"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText="Create"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="legal_name"
          label="Legal Name"
          rules={[{ required: true, message: 'Legal name is required' }]}
        >
          <Input placeholder="Company Inc." />
        </Form.Item>

        <Form.Item name="email" label="Email">
          <Input type="email" placeholder="contact@company.com" />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input placeholder="+1 (555) 000-0000" />
        </Form.Item>

        <Form.Item name="address_line_1" label="Address">
          <Input placeholder="123 Main St" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="city" label="City">
            <Input />
          </Form.Item>

          <Form.Item name="state" label="State">
            <Input />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="zip" label="ZIP">
            <Input />
          </Form.Item>

          <Form.Item name="country" label="Country">
            <Input />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
