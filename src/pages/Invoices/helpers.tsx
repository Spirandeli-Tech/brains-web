import { pdf } from "@react-pdf/renderer";
import { Button, Space } from "antd";
import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { InvoiceData, InvoiceListItem } from "@/lib/clients/invoices";
import { StatusPill } from "@/components/atoms";
import { InvoicePdf } from "./components/InvoicePdf";

type StatusVariant = "success" | "warning" | "danger" | "info" | "default";

const STATUS_VARIANT: Record<string, StatusVariant> = {
  draft: "default",
  sent: "info",
  paid: "success",
  void: "danger",
};

export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function downloadInvoicePdf(
  invoice: InvoiceData,
): Promise<void> {
  const blob = await pdf(<InvoicePdf invoice={invoice} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoice_number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getInvoiceColumns(
  onDelete: (invoice: InvoiceListItem) => void,
  onDownload: (invoice: InvoiceListItem) => void,
): ColumnsType<InvoiceListItem> {
  return [
    {
      title: "Invoice #",
      dataIndex: "invoice_number",
      key: "invoice_number",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) =>
        record.customer.display_name || record.customer.legal_name,
    },
    {
      title: "Issue Date",
      dataIndex: "issue_date",
      key: "issue_date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <StatusPill variant={STATUS_VARIANT[status] ?? "default"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusPill>
      ),
    },
    {
      title: "Total",
      key: "total_amount",
      align: "right",
      render: (_, record) =>
        formatCurrency(record.total_amount, record.currency),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => onDownload(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          />
        </Space>
      ),
    },
  ];
}
