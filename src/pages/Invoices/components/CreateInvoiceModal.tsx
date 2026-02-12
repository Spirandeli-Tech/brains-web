import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { customersClient } from "@/lib/clients/customers";
import type { CustomerData } from "@/lib/clients/customers";
import { bankAccountsClient } from "@/lib/clients/bank-accounts";
import type { BankAccountData } from "@/lib/clients/bank-accounts";
import { invoicesClient } from "@/lib/clients/invoices";
import type { InvoiceData, RecurrenceFrequency } from "@/lib/clients/invoices";
import type { ServiceData } from "@/lib/clients/services";
import { formatCurrency } from "../helpers";
import { CreateCustomerModal } from "./CreateCustomerModal";
import { CreateBankAccountModal } from "./CreateBankAccountModal";
import { ServiceModal } from "./ServiceModal";

const ADD_NEW_CUSTOMER_VALUE = "__add_new__";
const ADD_NEW_BANK_ACCOUNT_VALUE = "__add_new_bank_account__";

const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "BRL", value: "BRL" },
];

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Void", value: "void" },
];

const FREQUENCY_OPTIONS: { label: string; value: RecurrenceFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const DAY_OF_WEEK_OPTIONS = [
  { label: "Monday", value: 0 },
  { label: "Tuesday", value: 1 },
  { label: "Wednesday", value: 2 },
  { label: "Thursday", value: 3 },
  { label: "Friday", value: 4 },
  { label: "Saturday", value: 5 },
  { label: "Sunday", value: 6 },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

interface ServiceRow {
  key: string;
  service_title: string;
  service_description?: string;
  amount: number;
}

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice?: InvoiceData | null;
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-text-primary mb-3 mt-0">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function InvoiceModal({
  open,
  onClose,
  onSuccess,
  invoice = null,
}: InvoiceModalProps) {
  const isEditing = !!invoice;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Customer state
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Bank account state
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [bankAccountModalOpen, setBankAccountModalOpen] = useState(false);

  // Services state
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await customersClient.listCustomers();
      setCustomers(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load customers",
      );
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchBankAccounts = async () => {
    setLoadingBankAccounts(true);
    try {
      const data = await bankAccountsClient.listBankAccounts();
      setBankAccounts(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load bank accounts",
      );
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchBankAccounts();
    }
  }, [open]);

  // Pre-populate form and services when editing
  useEffect(() => {
    if (open && invoice) {
      form.setFieldsValue({
        customer_id: invoice.customer.id,
        issue_date: dayjs(invoice.issue_date),
        due_date: dayjs(invoice.due_date),
        currency: invoice.currency,
        status: invoice.status,
        bank_account_id: invoice.bank_account?.id,
        notes: invoice.notes,
        is_recurrent: invoice.is_recurrent,
        recurrence_frequency: invoice.recurrence_frequency,
        recurrence_day: invoice.recurrence_day,
      });
      setServices(
        invoice.services.map((s) => ({
          key: s.id,
          service_title: s.service_title,
          service_description: s.service_description ?? undefined,
          amount: Number(s.amount),
        })),
      );
    }
  }, [open, invoice]);

  // Customer handlers
  const handleCustomerSelect = (value: string) => {
    if (value === ADD_NEW_CUSTOMER_VALUE) {
      form.setFieldValue("customer_id", undefined);
      setCustomerModalOpen(true);
    }
  };

  const handleCustomerCreated = (customer: CustomerData) => {
    setCustomerModalOpen(false);
    setCustomers((prev) => [...prev, customer]);
    form.setFieldValue("customer_id", customer.id);
  };

  // Bank account handlers
  const handleBankAccountSelect = (value: string) => {
    if (value === ADD_NEW_BANK_ACCOUNT_VALUE) {
      form.setFieldValue("bank_account_id", undefined);
      setBankAccountModalOpen(true);
    }
  };

  const handleBankAccountCreated = (bankAccount: BankAccountData) => {
    setBankAccountModalOpen(false);
    setBankAccounts((prev) => [...prev, bankAccount]);
    form.setFieldValue("bank_account_id", bankAccount.id);
  };

  // Service handlers
  const handleServiceCreated = (service: ServiceData) => {
    const row: ServiceRow = {
      key: service.id,
      service_title: service.service_title,
      service_description: service.service_description ?? undefined,
      amount: Number(service.amount),
    };
    if (editingService) {
      setServices((prev) =>
        prev.map((s) => (s.key === editingService.key ? row : s)),
      );
      setEditingService(null);
    } else {
      setServices((prev) => [...prev, row]);
    }
    setServiceModalOpen(false);
  };

  const handleEditService = (record: ServiceRow) => {
    setEditingService(record);
    setServiceModalOpen(true);
  };

  const handleRemoveService = (key: string) => {
    setServices((prev) => prev.filter((s) => s.key !== key));
  };

  const totalAmount = services.reduce((sum, s) => sum + s.amount, 0);
  const selectedCurrency = Form.useWatch("currency", form) || "USD";
  const isRecurrent = Form.useWatch("is_recurrent", form) ?? false;
  const recurrenceFrequency = Form.useWatch("recurrence_frequency", form) as RecurrenceFrequency | undefined;

  // Submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (services.length === 0) {
        message.error("Please add at least one service");
        return;
      }

      setSubmitting(true);

      const payload = {
        customer_id: values.customer_id,
        issue_date: values.issue_date.format("YYYY-MM-DD"),
        due_date: values.due_date.format("YYYY-MM-DD"),
        currency: values.currency,
        status: values.status,
        bank_account_id: values.bank_account_id || undefined,
        services: services.map((s, idx) => ({
          service_title: s.service_title,
          service_description: s.service_description,
          amount: s.amount,
          sort_order: idx,
        })),
        notes: values.notes || undefined,
        is_recurrent: values.is_recurrent || false,
        recurrence_frequency: values.is_recurrent ? values.recurrence_frequency : undefined,
        recurrence_day: values.is_recurrent ? values.recurrence_day : undefined,
      };

      if (isEditing) {
        await invoicesClient.updateInvoice(invoice!.id, payload);
        message.success("Invoice updated");
      } else {
        await invoicesClient.createInvoice(payload);
        message.success("Invoice created");
      }

      form.resetFields();
      setServices([]);
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setServices([]);
    setEditingService(null);
    onClose();
  };

  const serviceColumns: ColumnsType<ServiceRow> = [
    {
      title: "Title",
      dataIndex: "service_title",
      key: "service_title",
    },
    {
      title: "Description",
      dataIndex: "service_description",
      key: "service_description",
      render: (text: string | undefined) => text || "—",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number) => formatCurrency(amount, selectedCurrency),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditService(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveService(record.key)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <span className="text-[22px] font-semibold text-text-primary leading-tight">
            {isEditing ? "Edit Invoice" : "New Invoice"}
          </span>
        }
        open={open}
        onCancel={handleCancel}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
            >
              {isEditing ? "Save" : "Create"}
            </Button>
          </div>
        }
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-3"
          initialValues={{
            currency: "USD",
            status: "draft",
            issue_date: dayjs(),
            due_date: dayjs().add(30, "day"),
          }}
        >
          {/* Customer Section */}
          <FormSection title="Customer">
            <Form.Item
              name="customer_id"
              rules={[{ required: true, message: "Please select a customer" }]}
              className="mb-0"
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
                      <span className="text-brand-primary font-medium">
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
          </FormSection>

          {/* Details Section */}
          <FormSection title="Details">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="issue_date"
                label="Issue Date"
                rules={[{ required: true, message: "Issue date is required" }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="due_date"
                label="Due Date"
                rules={[{ required: true, message: "Due date is required" }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Form.Item name="currency" label="Currency">
                <Select options={CURRENCY_OPTIONS} />
              </Form.Item>

              <Form.Item name="status" label="Status">
                <Select options={STATUS_OPTIONS} />
              </Form.Item>

              <Form.Item name="bank_account_id" label="Bank Account">
                <Select
                  placeholder="Select bank account"
                  loading={loadingBankAccounts}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={handleBankAccountSelect}
                  options={[
                    {
                      label: (
                        <span className="text-brand-primary font-medium">
                          <PlusOutlined className="mr-1" /> Add New Bank Account
                        </span>
                      ),
                      value: ADD_NEW_BANK_ACCOUNT_VALUE,
                    },
                    ...bankAccounts.map((ba) => ({
                      label: ba.label,
                      value: ba.id,
                    })),
                  ]}
                />
              </Form.Item>
            </div>
          </FormSection>

          {/* Recurrence Section */}
          <FormSection title="Recurrence">
            <div className="flex items-center gap-3 mb-3">
              <Form.Item
                name="is_recurrent"
                valuePropName="checked"
                className="mb-0"
              >
                <Switch />
              </Form.Item>
              <span className="text-sm text-text-secondary">
                Enable recurring invoice
              </span>
            </div>

            {isRecurrent && (
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="recurrence_frequency"
                  label="Frequency"
                  rules={[
                    {
                      required: isRecurrent,
                      message: "Please select a frequency",
                    },
                  ]}
                >
                  <Select
                    placeholder="Select frequency"
                    options={FREQUENCY_OPTIONS}
                    onChange={() => {
                      form.setFieldValue("recurrence_day", undefined);
                    }}
                  />
                </Form.Item>

                {recurrenceFrequency === "weekly" && (
                  <Form.Item
                    name="recurrence_day"
                    label="Day of Week"
                    rules={[
                      {
                        required: true,
                        message: "Please select a day",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select day"
                      options={DAY_OF_WEEK_OPTIONS}
                    />
                  </Form.Item>
                )}

                {recurrenceFrequency === "monthly" && (
                  <Form.Item
                    name="recurrence_day"
                    label="Day of Month"
                    rules={[
                      {
                        required: true,
                        message: "Please select a day",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select day"
                      options={DAY_OF_MONTH_OPTIONS}
                    />
                  </Form.Item>
                )}
              </div>
            )}
          </FormSection>

          {/* Services Section */}
          <div className="mb-5">
            <div className="border border-border-subtle rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary m-0">
                  Services
                </h4>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  className="!text-brand-primary"
                  onClick={() => {
                    setEditingService(null);
                    setServiceModalOpen(true);
                  }}
                >
                  Add Service
                </Button>
              </div>

              {services.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-text-muted text-sm m-0">
                    No services added yet
                  </p>
                </div>
              ) : (
                <Table
                  columns={serviceColumns}
                  dataSource={services}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              )}

              <div className="flex items-center justify-end mt-3 pt-3 border-t border-border-divider gap-2">
                <span className="text-text-muted text-sm">Total</span>
                <span className="text-base font-semibold text-text-primary">
                  {formatCurrency(totalAmount, selectedCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <FormSection title="Notes">
            <Form.Item name="notes" className="mb-0">
              <Input.TextArea
                rows={2}
                placeholder="Additional notes (optional)"
              />
            </Form.Item>
          </FormSection>
        </Form>
      </Modal>

      <CreateCustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={handleCustomerCreated}
      />

      <CreateBankAccountModal
        open={bankAccountModalOpen}
        onClose={() => setBankAccountModalOpen(false)}
        onSuccess={handleBankAccountCreated}
      />

      <ServiceModal
        open={serviceModalOpen}
        onClose={() => {
          setServiceModalOpen(false);
          setEditingService(null);
        }}
        onSuccess={handleServiceCreated}
        service={
          editingService
            ? {
                id: editingService.key,
                service_title: editingService.service_title,
                service_description:
                  editingService.service_description ?? null,
                amount: editingService.amount,
                sort_order: null,
                created_at: "",
                updated_at: "",
              }
            : null
        }
      />
    </>
  );
}

// Backward-compatible alias
export const CreateInvoiceModal = InvoiceModal;
