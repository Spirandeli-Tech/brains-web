import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, FileOutlined, InboxOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { customersClient } from "@/lib/clients/customers";
import type { CustomerData } from "@/lib/clients/customers";
import { bankAccountsClient } from "@/lib/clients/bank-accounts";
import type { BankAccountData } from "@/lib/clients/bank-accounts";
import { contractsClient } from "@/lib/clients/contracts";
import type { ContractData } from "@/lib/clients/contracts";
import { servicesClient } from "@/lib/clients/services";
import type { ServiceData } from "@/lib/clients/services";
import { uploadFile } from "@/lib/firebase-storage";
import { CreateCustomerModal } from "@/pages/Invoices/components/CreateCustomerModal";
import { CreateBankAccountModal } from "@/pages/Invoices/components/CreateBankAccountModal";
import { ServiceModal } from "@/pages/Invoices/components/ServiceModal";

const ADD_NEW_CUSTOMER_VALUE = "__add_new__";
const ADD_NEW_BANK_ACCOUNT_VALUE = "__add_new_bank_account__";

const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "BRL", value: "BRL" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

interface ServiceRow {
  key: string;
  service_title: string;
  service_description?: string;
}

interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract?: ContractData | null;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-text-primary mb-3 mt-0">{title}</h4>
      {children}
    </div>
  );
}

function ContractPdfSection({
  pdfUrl,
  pdfFile,
  onFileSelect,
  onRemove,
}: {
  pdfUrl: string | null;
  pdfFile: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewSrc = pdfFile ? URL.createObjectURL(pdfFile) : pdfUrl;
  const hasFile = !!pdfFile || !!pdfUrl;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") onFileSelect(file);
  };

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  };

  if (hasFile) {
    return (
      <>
        <div className="border border-border-subtle rounded-xl overflow-hidden">
          {/* Inline preview */}
          <div
            className="bg-gray-50 cursor-pointer"
            onClick={() => setPreviewOpen(true)}
          >
            <iframe
              src={previewSrc || ""}
              title="Contract PDF preview"
              className="w-full h-48 pointer-events-none"
              style={{ border: "none" }}
            />
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle">
            <span className="flex items-center gap-2 text-sm text-text-primary truncate">
              <FileOutlined />
              {pdfFile ? pdfFile.name : "Contract PDF"}
            </span>
            <div className="flex gap-2 shrink-0">
              <Button size="small" onClick={() => setPreviewOpen(true)}>Preview</Button>
              <Button size="small" icon={<UploadOutlined />} onClick={openFilePicker}>Replace</Button>
              <Button size="small" danger onClick={onRemove}>Remove</Button>
            </div>
          </div>
        </div>

        {/* Full preview modal */}
        <Modal
          title="Contract PDF"
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          footer={null}
          width={900}
          styles={{ body: { padding: 0 } }}
        >
          <iframe
            src={previewSrc || ""}
            title="Contract PDF"
            className="w-full border-none"
            style={{ height: "75vh" }}
          />
        </Modal>
      </>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging ? "border-brand-primary bg-blue-50" : "border-border-subtle hover:border-brand-primary hover:bg-bg-page"
      }`}
      onClick={openFilePicker}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <InboxOutlined className="text-3xl text-text-muted" />
      <p className="text-text-muted text-sm m-0 mt-2">
        Drag & drop a PDF here, or click to browse
      </p>
    </div>
  );
}

export function ContractModal({ open, onClose, onSuccess, contract = null }: ContractModalProps) {
  const isEditing = !!contract;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [bankAccountModalOpen, setBankAccountModalOpen] = useState(false);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);

  const [catalogServices, setCatalogServices] = useState<ServiceData[]>([]);
  const [loadingCatalogServices, setLoadingCatalogServices] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      setCustomers(await customersClient.listCustomers());
    } catch { message.error("Failed to load customers"); }
    finally { setLoadingCustomers(false); }
  };

  const fetchBankAccounts = async () => {
    setLoadingBankAccounts(true);
    try {
      setBankAccounts(await bankAccountsClient.listBankAccounts());
    } catch { message.error("Failed to load bank accounts"); }
    finally { setLoadingBankAccounts(false); }
  };

  const fetchCatalogServices = async () => {
    setLoadingCatalogServices(true);
    try {
      setCatalogServices(await servicesClient.listServices());
    } catch { message.error("Failed to load services"); }
    finally { setLoadingCatalogServices(false); }
  };

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchBankAccounts();
      fetchCatalogServices();
    }
  }, [open]);

  useEffect(() => {
    if (open && contract) {
      form.setFieldsValue({
        customer_id: contract.customer.id,
        name: contract.name,
        status: contract.status,
        annual_value: Number(contract.annual_value),
        currency: contract.currency,
        invoice_day: contract.invoice_day,
        bank_account_id: contract.bank_account?.id,
        notes: contract.notes,
      });
      setServices(
        contract.services.map((s) => ({
          key: s.id,
          service_title: s.service_title,
          service_description: s.service_description ?? undefined,
        })),
      );
      setPdfUrl(contract.contract_pdf_url);
    }
  }, [open, contract]);

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

  const handleServiceCreated = (service: ServiceData) => {
    const row: ServiceRow = {
      key: service.id,
      service_title: service.service_title,
      service_description: service.service_description ?? undefined,
    };
    if (editingService) {
      setServices((prev) => prev.map((s) => (s.key === editingService.key ? row : s)));
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
    setServices((prev) => [...prev, {
      key: `${catalogService.id}-${Date.now()}`,
      service_title: catalogService.service_title,
      service_description: catalogService.service_description ?? undefined,
    }]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (services.length === 0) {
        message.error("Please add at least one service");
        return;
      }
      setSubmitting(true);

      // Upload PDF if a new file was selected
      let contractPdfUrl = pdfUrl;
      if (pdfFile) {
        setUploadingPdf(true);
        try {
          const path = `contracts/${Date.now()}-${pdfFile.name}`;
          contractPdfUrl = await uploadFile(pdfFile, path);
        } catch {
          message.error("Failed to upload PDF");
          return;
        } finally {
          setUploadingPdf(false);
        }
      }

      const payload = {
        customer_id: values.customer_id,
        name: values.name,
        status: values.status,
        annual_value: values.annual_value,
        currency: values.currency,
        invoice_day: values.invoice_day,
        bank_account_id: values.bank_account_id || undefined,
        services: services.map((s, idx) => ({
          service_title: s.service_title,
          service_description: s.service_description,
          sort_order: idx,
        })),
        notes: values.notes || undefined,
        contract_pdf_url: contractPdfUrl || undefined,
      };

      if (isEditing) {
        await contractsClient.updateContract(contract!.id, payload);
        message.success("Contract updated");
      } else {
        await contractsClient.createContract(payload);
        message.success("Contract created");
      }

      form.resetFields();
      setServices([]);
      setPdfFile(null);
      setPdfUrl(null);
      onSuccess();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setServices([]);
    setEditingService(null);
    setPdfFile(null);
    setPdfUrl(null);
    onClose();
  };

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: "Title", dataIndex: "service_title", key: "service_title" },
    {
      title: "Description",
      dataIndex: "service_description",
      key: "service_description",
      render: (text: string | undefined) => text || "\u2014",
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingService(record); setServiceModalOpen(true); }} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => setServices((prev) => prev.filter((s) => s.key !== record.key))} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <span className="text-[22px] font-semibold text-text-primary leading-tight">
            {isEditing ? "Edit Contract" : "New Contract"}
          </span>
        }
        open={open}
        onCancel={handleCancel}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
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
          initialValues={{ currency: "USD", status: "active", invoice_day: 1 }}
        >
          <FormSection title="Contract Info">
            <Form.Item
              name="name"
              label="Contract Name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Input placeholder="e.g. EcoInteractive 2026" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
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
                      label: (<span className="text-brand-primary font-medium"><PlusOutlined className="mr-1" /> Add New Customer</span>),
                      value: ADD_NEW_CUSTOMER_VALUE,
                    },
                    ...customers.map((c) => ({ label: c.display_name || c.legal_name, value: c.id })),
                  ]}
                />
              </Form.Item>

              <Form.Item name="status" label="Status">
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </div>
          </FormSection>

          <FormSection title="Billing">
            {/* Annual Value Card */}
            <div className="border border-border-subtle rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between gap-6">
                <div className="shrink-0">
                  <p className="text-sm font-semibold text-text-primary m-0">Annual Value</p>
                  <p className="text-xs text-text-muted m-0 mt-0.5">Total contract value per year</p>
                </div>
                <div className="flex items-center gap-3">
                  <Form.Item name="currency" className="!mb-0">
                    <Select options={CURRENCY_OPTIONS} style={{ width: 80 }} />
                  </Form.Item>
                  <Form.Item
                    name="annual_value"
                    className="!mb-0"
                    rules={[
                      { required: true, message: "Required" },
                      { type: "number", min: 0.01, message: "Must be > 0" },
                    ]}
                  >
                    <InputNumber
                      className="!w-44 [&_input]:!text-right"
                      min={0.01}
                      step={100}
                      precision={2}
                      controls={false}
                      placeholder="0.00"
                      style={{ height: 48, fontSize: 18, fontWeight: 600 }}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="invoice_day"
                label="Invoice Day (monthly)"
                rules={[{ required: true, message: "Invoice day is required" }]}
              >
                <Select options={DAY_OF_MONTH_OPTIONS} />
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
                      label: (<span className="text-brand-primary font-medium"><PlusOutlined className="mr-1" /> Add New Bank Account</span>),
                      value: ADD_NEW_BANK_ACCOUNT_VALUE,
                    },
                    ...bankAccounts.map((ba) => ({ label: ba.label, value: ba.id })),
                  ]}
                />
              </Form.Item>
            </div>
          </FormSection>

          {/* Contract PDF */}
          <FormSection title="Contract PDF">
            <ContractPdfSection
              pdfUrl={pdfUrl}
              pdfFile={pdfFile}
              onFileSelect={setPdfFile}
              onRemove={() => { setPdfUrl(null); setPdfFile(null); }}
            />
          </FormSection>

          <div className="mb-5">
            <div className="border border-border-subtle rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary m-0">Services</h4>
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
                    options={catalogServices.map((s) => ({ label: s.service_title, value: s.id }))}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    className="!text-brand-primary"
                    onClick={() => { setEditingService(null); setServiceModalOpen(true); }}
                  >
                    New Service
                  </Button>
                </div>
              </div>

              {services.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-text-muted text-sm m-0">No services added yet</p>
                </div>
              ) : (
                <Table columns={serviceColumns} dataSource={services} rowKey="key" pagination={false} size="small" />
              )}

            </div>
          </div>

          <FormSection title="Notes">
            <Form.Item name="notes" className="mb-0">
              <Input.TextArea rows={2} placeholder="Additional notes (optional)" />
            </Form.Item>
          </FormSection>
        </Form>
      </Modal>

      <CreateCustomerModal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onSuccess={handleCustomerCreated} />
      <CreateBankAccountModal open={bankAccountModalOpen} onClose={() => setBankAccountModalOpen(false)} onSuccess={handleBankAccountCreated} />
      <ServiceModal
        open={serviceModalOpen}
        onClose={() => { setServiceModalOpen(false); setEditingService(null); }}
        onSuccess={handleServiceCreated}
        service={editingService ? { id: editingService.key, service_title: editingService.service_title, service_description: editingService.service_description ?? null, sort_order: null, created_at: "", updated_at: "" } : null}
      />
    </>
  );
}
