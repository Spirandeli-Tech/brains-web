import { pdf } from "@react-pdf/renderer";
import { Button, Space, Tooltip } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
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

export interface MonthGroupRow {
  _isGroupRow: true;
  _monthKey: string;
  _label: string;
  _count: number;
  _total: number;
  _currency: string;
}

export type InvoiceTableRow = InvoiceListItem | MonthGroupRow;

export function isGroupRow(row: InvoiceTableRow): row is MonthGroupRow {
  return "_isGroupRow" in row && row._isGroupRow === true;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function groupInvoicesByMonth(
  invoices: InvoiceListItem[],
): InvoiceTableRow[] {
  const groups = new Map<string, InvoiceListItem[]>();

  for (const inv of invoices) {
    const key = getMonthKey(inv.issue_date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(inv);
  }

  const sortedKeys = [...groups.keys()].sort((a, b) => b.localeCompare(a));
  const rows: InvoiceTableRow[] = [];

  for (const key of sortedKeys) {
    const items = groups.get(key)!;
    const total = items.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const currency = items[0].currency;

    rows.push({
      _isGroupRow: true,
      _monthKey: key,
      _label: getMonthLabel(items[0].issue_date),
      _count: items.length,
      _total: total,
      _currency: currency,
    });

    rows.push(...items);
  }

  return rows;
}

export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function downloadInvoicePdf(
  invoice: InvoiceData,
  themeColor?: string,
): Promise<void> {
  const blob = await pdf(
    <InvoicePdf invoice={invoice} themeColor={themeColor} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoice_number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

const TOTAL_COLUMNS = 6;

function groupCellProps(record: InvoiceTableRow, isFirst: boolean) {
  if (!isGroupRow(record)) return {};
  return isFirst ? { colSpan: TOTAL_COLUMNS } : { colSpan: 0 };
}

export function getInvoiceColumns(
  onDelete: (invoice: InvoiceListItem) => void,
  onDownload: (invoice: InvoiceListItem) => void,
  onEdit: (invoice: InvoiceListItem) => void,
  onDuplicate: (invoice: InvoiceListItem) => void,
  onStatusClick: (invoice: InvoiceListItem) => void,
): ColumnsType<InvoiceTableRow> {
  return [
    {
      title: "Invoice",
      dataIndex: "invoice_number",
      key: "invoice_number",
      onCell: (record) => groupCellProps(record, true),
      render: (value, record) => {
        if (isGroupRow(record)) {
          return (
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {record._label}
              <span
                style={{ fontWeight: 400, color: "#8c8c8c", marginLeft: 12 }}
              >
                {record._count} invoice{record._count !== 1 ? "s" : ""}
                {" \u00B7 "}
                {formatCurrency(record._total, record._currency)}
              </span>
            </span>
          );
        }
        return (
          <div>
            <div className="text-sm font-medium text-text-primary">{value}</div>
            <div className="text-xs text-text-muted">{record.customer.display_name || record.customer.legal_name}</div>
          </div>
        );
      },
    },
    {
      title: "Issue Date",
      dataIndex: "issue_date",
      key: "issue_date",
      onCell: (record) => groupCellProps(record, false),
      render: (date: string, record) => {
        if (isGroupRow(record)) return null;
        return new Date(date).toLocaleDateString();
      },
    },
    {
      title: "Payment Date",
      dataIndex: "payment_date",
      key: "payment_date",
      onCell: (record) => groupCellProps(record, false),
      render: (date: string | null, record) => {
        if (isGroupRow(record)) return null;
        return date ? new Date(date).toLocaleDateString() : "\u2014";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      onCell: (record) => groupCellProps(record, false),
      render: (status: string, record) => {
        if (isGroupRow(record)) return null;
        return (
          <button
            className="bg-transparent border-none p-0 cursor-pointer"
            onClick={() => onStatusClick(record as InvoiceListItem)}
          >
            <StatusPill variant={STATUS_VARIANT[status] ?? "default"}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusPill>
          </button>
        );
      },
    },
    {
      title: "Total",
      key: "total_amount",
      align: "right",
      onCell: (record) => groupCellProps(record, false),
      render: (_, record) => {
        if (isGroupRow(record)) return null;
        return formatCurrency(record.total_amount, record.currency);
      },
    },
    {
      title: "Actions",
      key: "actions",
      onCell: (record) => groupCellProps(record, false),
      render: (_, record) => {
        if (isGroupRow(record)) return null;
        return (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record as InvoiceListItem)}
            />
            <Tooltip title="Duplicate">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => onDuplicate(record as InvoiceListItem)}
              />
            </Tooltip>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(record as InvoiceListItem)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record as InvoiceListItem)}
            />
          </Space>
        );
      },
    },
  ];
}
