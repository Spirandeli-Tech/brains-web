import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { DatePicker, Form, Input, InputNumber, Modal, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { customersClient } from '@/lib/clients/customers'
import type { CustomerData } from '@/lib/clients/customers'
import { invoicesClient } from '@/lib/clients/invoices'
import { CreateCustomerModal } from './CreateCustomerModal'

const ADD_NEW_CUSTOMER_VALUE = '__add_new__'

const CURRENCY_OPTIONS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'BRL', value: 'BRL' },
]

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Void', value: 'void' },
]

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateInvoiceModal({ open, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)

  const fetchCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const data = await customersClient.listCustomers()
      setCustomers(data)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCustomers()
    }
  }, [open])

  const handleCustomerSelect = (value: string) => {
    if (value === ADD_NEW_CUSTOMER_VALUE) {
      form.setFieldValue('customer_id', undefined)
      setCustomerModalOpen(true)
    }
  }

  const handleCustomerCreated = (customer: CustomerData) => {
    setCustomerModalOpen(false)
    setCustomers((prev) => [...prev, customer])
    form.setFieldValue('customer_id', customer.id)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      await invoicesClient.createInvoice({
        customer_id: values.customer_id,
        issue_date: values.issue_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        service_title: values.service_title,
        service_description: values.service_description,
        amount_total: values.amount_total,
        currency: values.currency,
        status: values.status,
        notes: values.notes || undefined,
      })

      message.success('Invoice created')
      form.resetFields()
      onSuccess()
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
    <>
      <Modal
        title="New Invoice"
        open={open}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting}
        okText="Create"
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          initialValues={{ currency: 'USD', status: 'draft', issue_date: dayjs(), due_date: dayjs().add(30, 'day') }}
        >
          <Form.Item
            name="customer_id"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              placeholder="Select a customer"
              loading={loadingCustomers}
              showSearch
              optionFilterProp="label"
              onChange={handleCustomerSelect}
              options={[
                {
                  label: (
                    <span className="text-blue-600 font-medium">
                      <PlusOutlined className="mr-1" /> Add New Customer
                    </span>
                  ),
                  value: ADD_NEW_CUSTOMER_VALUE,
                },
                ...customers.map((c) => ({
                  label: c.display_name || c.legal_name,
                  value: c.id,
                })),
              ]}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="issue_date"
              label="Issue Date"
              rules={[{ required: true, message: 'Issue date is required' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="due_date"
              label="Due Date"
              rules={[{ required: true, message: 'Due date is required' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            name="service_title"
            label="Service Title"
            rules={[{ required: true, message: 'Service title is required' }]}
          >
            <Input placeholder="Web Development Services" />
          </Form.Item>

          <Form.Item
            name="service_description"
            label="Service Description"
            rules={[{ required: true, message: 'Service description is required' }]}
          >
            <Input.TextArea rows={3} placeholder="Description of services rendered..." />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="currency"
              label="Currency"
            >
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>

            <Form.Item
              name="amount_total"
              label="Total Amount"
              rules={[
                { required: true, message: 'Amount is required' },
                { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
              ]}
            >
              <InputNumber className="w-full" min={0.01} step={0.01} precision={2} />
            </Form.Item>

            <Form.Item name="status" label="Status">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      <CreateCustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={handleCustomerCreated}
      />
    </>
  )
}
