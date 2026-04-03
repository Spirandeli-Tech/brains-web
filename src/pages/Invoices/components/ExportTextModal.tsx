import { useMemo, useState } from "react";
import { Button, DatePicker, Modal, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { InvoiceListItem } from "@/lib/clients/invoices";

interface ExportTextModalProps {
  open: boolean;
  onClose: () => void;
  invoices: InvoiceListItem[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === "USD" ? "U$" : currency;
  return `${symbol} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExportTextModal({ open, onClose, invoices }: ExportTextModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(dayjs());

  const { text, count } = useMemo(() => {
    const year = selectedMonth.year();
    const month = selectedMonth.month(); // 0-indexed
    const monthName = MONTH_NAMES[month].toUpperCase();

    const filtered = invoices.filter((inv) => {
      const d = new Date(inv.issue_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    if (filtered.length === 0) {
      return { text: `${monthName} ${year} PAYMENTS\n\nNo invoices found for this month.`, count: 0 };
    }

    // Sort by issue_date
    const sorted = [...filtered].sort((a, b) => a.issue_date.localeCompare(b.issue_date));

    const lines: string[] = [];
    lines.push(`${monthName} ${year} PAYMENTS`);
    lines.push("");

    sorted.forEach((inv, idx) => {
      const customerName = (inv.customer.display_name || inv.customer.legal_name).toUpperCase();
      const date = new Date(inv.issue_date);
      const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;

      lines.push(`PAYMENT ${String(idx + 1).padStart(2, "0")}`);
      lines.push(`Client: ${customerName}`);
      lines.push(`Date: ${dateStr}`);
      lines.push(`Amount: ${formatAmount(Number(inv.total_amount), inv.currency)}`);
      lines.push("");
    });

    const total = sorted.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const currency = sorted[0].currency;
    lines.push(`Total invoiced in ${MONTH_NAMES[month]}: ${formatAmount(total, currency)}`);

    return { text: lines.join("\n"), count: sorted.length };
  }, [invoices, selectedMonth]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    message.success("Copied to clipboard");
  };

  return (
    <Modal
      title={
        <span className="text-xl font-semibold text-text-primary leading-tight">
          Export Invoice Summary
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={
        <div className="flex justify-between">
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            Copy to Clipboard
          </Button>
        </div>
      }
      width={600}
      destroyOnClose
    >
      <div className="flex items-center gap-3 mb-4 mt-3">
        <span className="text-sm text-text-muted">Month:</span>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(val) => val && setSelectedMonth(val)}
          allowClear={false}
        />
        <span className="text-xs text-text-muted">
          {count} invoice{count !== 1 ? "s" : ""}
        </span>
      </div>

      <pre className="bg-bg-page border border-border-subtle rounded-lg p-4 text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto m-0">
        {text}
      </pre>
    </Modal>
  );
}
