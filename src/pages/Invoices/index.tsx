import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { invoicesClient } from "@/lib/clients/invoices";
import type { InvoiceData, InvoiceListItem } from "@/lib/clients/invoices";
import { PageHeader, DataCard } from "@/components/molecules";
import { InvoiceModal } from "./components/CreateInvoiceModal";
import { downloadInvoicePdf, getInvoiceColumns } from "./helpers";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);

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

  const handleEdit = async (invoice: InvoiceListItem) => {
    try {
      const full = await invoicesClient.getInvoice(invoice.id);
      setEditingInvoice(full);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load invoice",
      );
    }
  };

  const columns = getInvoiceColumns(handleDelete, handleDownload, handleEdit);

  const modalOpen = createModalOpen || editingInvoice !== null;

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingInvoice(null);
  };

  const handleModalSuccess = () => {
    setCreateModalOpen(false);
    setEditingInvoice(null);
    fetchInvoices();
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all your invoices"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            New Invoice
          </Button>
        }
      />
      <DataCard>
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </DataCard>
      <InvoiceModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        invoice={editingInvoice}
      />
    </div>
  );
}
