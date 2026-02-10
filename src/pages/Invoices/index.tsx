import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { invoicesClient } from "@/lib/clients/invoices";
import type { InvoiceListItem } from "@/lib/clients/invoices";
import { CreateInvoiceModal } from "./components/CreateInvoiceModal";
import { downloadInvoicePdf, getInvoiceColumns } from "./helpers";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoicesClient.listInvoices();
      setInvoices(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load invoices",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = (invoice: InvoiceListItem) => {
    Modal.confirm({
      title: "Delete Invoice",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete invoice ${invoice.invoice_number}?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await invoicesClient.deleteInvoice(invoice.id);
          message.success("Invoice deleted");
          fetchInvoices();
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : "Failed to delete invoice",
          );
        }
      },
    });
  };

  const handleDownload = async (invoice: InvoiceListItem) => {
    try {
      const full = await invoicesClient.getInvoice(invoice.id);
      await downloadInvoicePdf(full);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to download invoice",
      );
    }
  };

  const columns = getInvoiceColumns(handleDelete, handleDownload);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
        >
          New Invoice
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
      <CreateInvoiceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchInvoices();
        }}
      />
    </div>
  );
}
