import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  message,
} from "antd";
import { transactionsClient } from "@/lib/clients/transactions";
import type {
  TransactionContext,
  TransactionData,
  TransactionType,
} from "@/lib/clients/transactions";
import { bankAccountsClient } from "@/lib/clients/bank-accounts";
import type { BankAccountData } from "@/lib/clients/bank-accounts";
import { transactionCategoriesClient } from "@/lib/clients/transaction-categories";
import type { TransactionCategoryData } from "@/lib/clients/transaction-categories";

const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "BRL", value: "BRL" },
];

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: TransactionData | null;
  defaultContext?: TransactionContext;
}

export function TransactionModal({
  open,
  onClose,
  onSuccess,
  transaction = null,
  defaultContext = "business",
}: TransactionModalProps) {
  const isEditing = !!transaction;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<TransactionCategoryData[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);

  useEffect(() => {
    if (open) {
      transactionCategoriesClient.listCategories().then(setCategories);
      bankAccountsClient.listBankAccounts().then(setBankAccounts);
    }
  }, [open]);

  useEffect(() => {
    if (open && transaction) {
      form.setFieldsValue({
        type: transaction.type,
        context: transaction.context,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        date: dayjs(transaction.date),
        category_id: transaction.category?.id || undefined,
        bank_account_id: transaction.bank_account?.id || undefined,
        notes: transaction.notes || undefined,
      });
    } else if (open) {
      form.setFieldsValue({
        type: "expense",
        context: defaultContext,
        currency: "BRL",
        date: dayjs(),
      });
    }
  }, [open, transaction, form, defaultContext]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        category_id: values.category_id || undefined,
        bank_account_id: values.bank_account_id || undefined,
        notes: values.notes || undefined,
      };

      if (isEditing) {
        await transactionsClient.updateTransaction(transaction.id, payload);
        message.success("Transaction updated");
      } else {
        await transactionsClient.createTransaction(payload);
        message.success("Transaction created");
      }

      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Transaction" : "New Transaction"}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={submitting}
      destroyOnClose
      afterClose={() => form.resetFields()}
      width={520}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: "Expense", value: "expense" as TransactionType },
              { label: "Income", value: "income" as TransactionType },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="context"
          label="Context"
          rules={[{ required: true }]}
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: "Business", value: "business" as TransactionContext },
              { label: "Personal", value: "personal" as TransactionContext },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Description is required" }]}
        >
          <Input placeholder="e.g. Monthly hosting subscription" />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: "Amount is required" },
              {
                type: "number",
                min: 0.01,
                message: "Amount must be greater than 0",
              },
            ]}
            className="flex-1"
          >
            <InputNumber
              className="w-full"
              precision={2}
              min={0.01}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true }]}
            className="w-28"
          >
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
        </div>

        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Date is required" }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item name="category_id" label="Category">
          <Select
            allowClear
            placeholder="Select a category"
            options={categories.map((c) => ({
              label: (
                <span className="flex items-center gap-2">
                  {c.color && (
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  )}
                  {c.name}
                </span>
              ),
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item name="bank_account_id" label="Bank Account">
          <Select
            allowClear
            placeholder="Select a bank account"
            options={bankAccounts.map((ba) => ({
              label: ba.label,
              value: ba.id,
            }))}
          />
        </Form.Item>

        <Collapse
          ghost
          items={[
            {
              key: "notes",
              label: "Notes (optional)",
              children: (
                <Form.Item name="notes" className="mb-0">
                  <Input.TextArea
                    rows={3}
                    placeholder="Additional notes about this transaction"
                  />
                </Form.Item>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
}
