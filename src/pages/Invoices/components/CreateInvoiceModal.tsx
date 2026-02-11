import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
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

interface ServiceRow {
  key: string;
  service_title: string;
  service_description?: string;
  amount: number;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInvoiceModal({
  open,
  onClose,
  onSuccess,
}: CreateInvoiceModalProps) {
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

  // Submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (services.length === 0) {
        message.error("Please add at least one service");
        return;
      }

      setSubmitting(true);

      await invoicesClient.createInvoice({
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
      });

      message.success("Invoice created");
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
        title="New Invoice"
        open={open}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting}
        okText="Create"
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          initialValues={{
            currency: "USD",
            status: "draft",
            issue_date: dayjs(),
            due_date: dayjs().add(30, "day"),
          }}
        >
          <Form.Item
            name="customer_id"
            label="Customer"
            rules={[{ required: true, message: "Please select a customer" }]}
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

          <div className="grid grid-cols-3 gap-4">
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
                      <span className="text-blue-600 font-medium">
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

          {/* Services section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium">Services</label>
              <Button
                type="link"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
              >
                Add Service
              </Button>
            </div>

            <Table
              columns={serviceColumns}
              dataSource={services}
              rowKey="key"
              pagination={false}
              size="small"
              locale={{ emptyText: "No services added yet" }}
            />

            <div className="flex justify-end mt-2 text-base font-semibold">
              Total: {formatCurrency(totalAmount, selectedCurrency)}
            </div>
          </div>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea
              rows={2}
              placeholder="Additional notes (optional)"
            />
          </Form.Item>
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
