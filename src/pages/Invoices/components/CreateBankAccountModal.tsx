import { useEffect, useState } from 'react'
import { Collapse, Form, Input, Modal, message } from 'antd'
import { bankAccountsClient } from '@/lib/clients/bank-accounts'
import type { BankAccountData } from '@/lib/clients/bank-accounts'

interface CreateBankAccountModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (bankAccount: BankAccountData) => void
  bankAccount?: BankAccountData | null
}

export function CreateBankAccountModal({ open, onClose, onSuccess, bankAccount }: CreateBankAccountModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!bankAccount

  useEffect(() => {
    if (open && bankAccount) {
      form.setFieldsValue({
        label: bankAccount.label,
        beneficiary_full_name: bankAccount.beneficiary_full_name,
        beneficiary_full_address: bankAccount.beneficiary_full_address,
        beneficiary_account_number: bankAccount.beneficiary_account_number,
        swift_code: bankAccount.swift_code,
        bank_name: bankAccount.bank_name,
        bank_address: bankAccount.bank_address,
        intermediary_bank_info: bankAccount.intermediary_bank_info,
      })
    }
  }, [open, bankAccount, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (isEditing) {
        const updated = await bankAccountsClient.updateBankAccount(bankAccount.id, values)
        message.success('Bank account updated')
        form.resetFields()
        onSuccess(updated)
      } else {
        const created = await bankAccountsClient.createBankAccount(values)
        message.success('Bank account created')
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
      title={isEditing ? 'Edit Bank Account' : 'New Bank Account'}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText={isEditing ? 'Save' : 'Create'}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="label"
          label="Label"
          rules={[{ required: true, message: 'Label is required' }]}
        >
          <Input placeholder="e.g. USD Account (Citibank)" />
        </Form.Item>

        <Form.Item
          name="beneficiary_full_name"
          label="Beneficiary Full Name"
          rules={[{ required: true, message: 'Beneficiary name is required' }]}
        >
          <Input placeholder="Company Inc." />
        </Form.Item>

        <Form.Item name="beneficiary_full_address" label="Beneficiary Full Address">
          <Input placeholder="123 Main St, New York, NY 10001" />
        </Form.Item>

        <Form.Item
          name="beneficiary_account_number"
          label="Account Number / IBAN"
          rules={[{ required: true, message: 'Account number is required' }]}
        >
          <Input placeholder="IBAN or account number" />
        </Form.Item>

        <Form.Item
          name="swift_code"
          label="SWIFT Code"
          rules={[{ required: true, message: 'SWIFT code is required' }]}
        >
          <Input placeholder="CITIUS33" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="bank_name" label="Bank Name">
            <Input placeholder="Citibank N.A." />
          </Form.Item>

          <Form.Item name="bank_address" label="Bank Address">
            <Input placeholder="New York, NY" />
          </Form.Item>
        </div>

        <Collapse
          ghost
          items={[
            {
              key: 'intermediary',
              label: 'Intermediary Bank (optional)',
              children: (
                <Form.Item name="intermediary_bank_info" label="Intermediary Bank Details">
                  <Input.TextArea
                    rows={4}
                    placeholder={"e.g.\nBank: JPMorgan Chase\nSWIFT: CHASUS33\nAccount: 123456789\nAddress: New York, NY"}
                  />
                </Form.Item>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  )
}
