import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
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

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: TransactionData | null;
  defaultContext?: TransactionContext;
  defaultCurrency?: string;
}

export function TransactionModal({
  open,
  onClose,
  onSuccess,
  transaction = null,
  defaultContext = "business",
  defaultCurrency = "USD",
}: TransactionModalProps) {
  const isEditing = !!transaction;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<TransactionCategoryData[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (open) {
      transactionCategoriesClient.listCategories().then(setCategories);
      bankAccountsClient.listBankAccounts().then(setBankAccounts);
    }
  }, [open]);

  const handleCreateCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return;

    setCreatingCategory(true);
    try {
      const created = await transactionCategoriesClient.createCategory({
        name: trimmed,
      });
      setCategories((prev) => [...prev, created]);
      form.setFieldValue("category_id", created.id);
      setCategorySearch("");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setCreatingCategory(false);
    }
  };

  const filteredCategories = categorySearch
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase()),
      )
    : categories;

  const showCreateOption =
    categorySearch.trim() &&
    !categories.some(
      (c) => c.name.toLowerCase() === categorySearch.trim().toLowerCase(),
    );

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
        currency: defaultCurrency,
        date: dayjs(),
      });
    }
  }, [open, transaction, form, defaultContext, defaultCurrency]);

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
          rules={[{ required: true }]}
          className="!mb-3"
        >
          <Segmented
            block
            options={[
              { label: "Expense", value: "expense" as TransactionType },
              { label: "Income", value: "income" as TransactionType },
            ]}
          />
        </Form.Item>

        {/* Hidden fields: context and currency come from parent */}
        <Form.Item name="context" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="currency" hidden>
          <Input />
        </Form.Item>

        {/* Amount Card */}
        <div className="border border-border-subtle rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-6">
            <div className="shrink-0">
              <p className="text-sm font-semibold text-text-primary m-0">
                Amount
              </p>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Enter the transaction value
              </p>
            </div>
            <Form.Item
              name="amount"
              className="!mb-0"
              rules={[
                { required: true, message: "Amount is required" },
                {
                  type: "number",
                  min: 0.01,
                  message: "Amount must be greater than 0",
                },
              ]}
            >
              <InputNumber
                className="!w-44 [&_input]:!text-right"
                min={0.01}
                step={0.01}
                precision={2}
                controls={false}
                placeholder="0.00"
                style={{ height: 48, fontSize: 18, fontWeight: 600 }}
              />
            </Form.Item>
          </div>
        </div>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Description is required" }]}
        >
          <Input placeholder="e.g. Monthly hosting subscription" />
        </Form.Item>

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
            showSearch
            placeholder="Search or create a category"
            filterOption={false}
            searchValue={categorySearch}
            onSearch={setCategorySearch}
            onSelect={() => setCategorySearch("")}
            onClear={() => setCategorySearch("")}
            loading={creatingCategory}
            notFoundContent={null}
            dropdownRender={(menu) => (
              <>
                {menu}
                {showCreateOption && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer text-brand-primary hover:bg-bg-hover border-t border-border-subtle"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleCreateCategory(categorySearch)}
                  >
                    <PlusOutlined />
                    <span>
                      Create "<strong>{categorySearch.trim()}</strong>"
                    </span>
                  </div>
                )}
              </>
            )}
            options={filteredCategories.map((c) => ({
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
