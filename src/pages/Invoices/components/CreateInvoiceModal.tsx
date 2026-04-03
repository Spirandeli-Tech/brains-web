import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
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
import type { InvoiceData } from "@/lib/clients/invoices";
import { servicesClient } from "@/lib/clients/services";
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

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice?: InvoiceData | null;
  duplicateFrom?: InvoiceData | null;
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
  duplicateFrom = null,
}: InvoiceModalProps) {
  const isEditing = !!invoice;
  const sourceInvoice = invoice || duplicateFrom;
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

  // Existing services catalog
  const [catalogServices, setCatalogServices] = useState<ServiceData[]>([]);
  const [loadingCatalogServices, setLoadingCatalogServices] = useState(false);

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

  const fetchCatalogServices = async () => {
    setLoadingCatalogServices(true);
    try {
      const data = await servicesClient.listServices();
      setCatalogServices(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load services",
      );
    } finally {
      setLoadingCatalogServices(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchBankAccounts();
      fetchCatalogServices();
    }
  }, [open]);

  // Pre-populate form and services when editing or duplicating
  useEffect(() => {
    if (open && sourceInvoice) {
      form.setFieldsValue({
        customer_id: sourceInvoice.customer.id,
        issue_date: duplicateFrom ? dayjs() : dayjs(sourceInvoice.issue_date),
        due_date: duplicateFrom ? dayjs().add(30, "day") : dayjs(sourceInvoice.due_date),
        currency: sourceInvoice.currency,
        status: duplicateFrom ? "draft" : sourceInvoice.status,
        bank_account_id: sourceInvoice.bank_account?.id,
        notes: sourceInvoice.notes,
      });
      setTotalAmount(Number(sourceInvoice.total_amount));
      setServices(
        sourceInvoice.services.map((s) => ({
          key: `${s.id}-${duplicateFrom ? Date.now() : ""}`,
          service_title: s.service_title,
          service_description: s.service_description ?? undefined,
          amount: Number(s.amount),
        })),
      );
    }
  }, [open, sourceInvoice]);

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
      amount: editingService ? editingService.amount : 0,
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
    fetchCatalogServices();
  };

  const handleAddExistingService = (serviceId: string) => {
    const catalogService = catalogServices.find((s) => s.id === serviceId);
    if (!catalogService) return;

    const row: ServiceRow = {
      key: `${catalogService.id}-${Date.now()}`,
      service_title: catalogService.service_title,
      service_description: catalogService.service_description ?? undefined,
      amount: 0,
    };
    setServices((prev) => [...prev, row]);
  };

  const handleEditService = (record: ServiceRow) => {
    setEditingService(record);
    setServiceModalOpen(true);
  };

  const handleRemoveService = (key: string) => {
    setServices((prev) => prev.filter((s) => s.key !== key));
  };

  const [totalAmount, setTotalAmount] = useState<number>(0);
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
          amount: s.amount || undefined,
          sort_order: idx,
        })),
        notes: values.notes || undefined,
        total_amount: totalAmount,
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
      setTotalAmount(0);
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
    setTotalAmount(0);
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

          {/* Services Section */}
          <div className="mb-5">
            <div className="border border-border-subtle rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary m-0">
                  Services
                </h4>
                <div className="flex items-center gap-2">
                  <Select
                    placeholder="Add existing service"
                    loading={loadingCatalogServices}
                    showSearch
                    optionFilterProp="label"
                    value={undefined}
                    onChange={handleAddExistingService}
                    style={{ width: 200 }}
                    size="small"
                    options={catalogServices.map((s) => ({
                      label: s.service_title,
                      value: s.id,
                    }))}
                  />
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
                    New Service
                  </Button>
                </div>
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

              <div className="flex items-center justify-end mt-3 pt-3 border-t border-border-divider gap-3">
                <span className="text-text-muted text-sm">Total</span>
                <InputNumber
                  value={totalAmount}
                  onChange={(val) => setTotalAmount(val ?? 0)}
                  min={0}
                  step={0.01}
                  precision={2}
                  controls={false}
                  className="!w-36 [&_input]:!text-right"
                  style={{ height: 40, fontSize: 16, fontWeight: 600 }}
                  prefix={selectedCurrency}
                />
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
