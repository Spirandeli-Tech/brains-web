import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import { ExclamationCircleOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import { invoicesClient } from "@/lib/clients/invoices";
import type { InvoiceData, InvoiceListItem } from "@/lib/clients/invoices";
import { usersClient } from "@/lib/clients/users";
import { PageHeader, DataCard } from "@/components/molecules";
import { InvoiceModal } from "./components/CreateInvoiceModal";
import { InvoiceStatusModal } from "./components/InvoiceStatusModal";
import { ExportTextModal } from "./components/ExportTextModal";
import { downloadInvoicePdf, getInvoiceColumns, groupInvoicesByMonth, isGroupRow } from "./helpers";
import type { InvoiceTableRow } from "./helpers";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const [duplicatingInvoice, setDuplicatingInvoice] = useState<InvoiceData | null>(null);
  const [themeColor, setThemeColor] = useState<string | undefined>();
  const [statusInvoice, setStatusInvoice] = useState<InvoiceListItem | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
    usersClient.getPreferences().then((prefs) => {
      if (prefs.report_theme_color) setThemeColor(prefs.report_theme_color);
    });
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
      await downloadInvoicePdf(full, themeColor);
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

  const handleDuplicate = async (invoice: InvoiceListItem) => {
    try {
      const full = await invoicesClient.getInvoice(invoice.id);
      setDuplicatingInvoice(full);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load invoice",
      );
    }
  };

  const groupedInvoices = useMemo(() => groupInvoicesByMonth(invoices), [invoices]);

  const columns = getInvoiceColumns(handleDelete, handleDownload, handleEdit, handleDuplicate, setStatusInvoice);

  const modalOpen = createModalOpen || editingInvoice !== null || duplicatingInvoice !== null;

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditingInvoice(null);
    setDuplicatingInvoice(null);
  };

  const handleModalSuccess = () => {
    setCreateModalOpen(false);
    setEditingInvoice(null);
    setDuplicatingInvoice(null);
    fetchInvoices();
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Manage and track all your invoices"
        actions={
          <div className="flex items-center gap-2">
            <Button
              icon={<FileTextOutlined />}
              onClick={() => setExportModalOpen(true)}
            >
              Export Summary
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              New Invoice
            </Button>
          </div>
        }
      />
      <DataCard>
        <Table<InvoiceTableRow>
          columns={columns}
          dataSource={groupedInvoices}
          rowKey={(record) => isGroupRow(record) ? record._monthKey : record.id}
          loading={loading}
          pagination={false}
          rowClassName={(record) => isGroupRow(record) ? "[&_td]:!bg-bg-page [&_td]:!border-b-border-subtle" : ""}
        />
      </DataCard>
      <InvoiceModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        invoice={editingInvoice}
        duplicateFrom={duplicatingInvoice}
      />
      <InvoiceStatusModal
        open={statusInvoice !== null}
        onClose={() => setStatusInvoice(null)}
        onSuccess={() => { setStatusInvoice(null); fetchInvoices(); }}
        invoice={statusInvoice}
      />
      <ExportTextModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        invoices={invoices}
      />
    </div>
  );
}
