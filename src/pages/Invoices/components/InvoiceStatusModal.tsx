import { useEffect, useState } from "react";
import { Button, DatePicker, Form, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { invoicesClient } from "@/lib/clients/invoices";
import type { InvoiceListItem } from "@/lib/clients/invoices";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Void", value: "void" },
];

interface InvoiceStatusModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: InvoiceListItem | null;
}

export function InvoiceStatusModal({ open, onClose, onSuccess, invoice }: InvoiceStatusModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    if (open && invoice) {
      form.setFieldsValue({
        status: invoice.status,
        payment_date: invoice.payment_date ? dayjs(invoice.payment_date) : null,
      });
    }
  }, [open, invoice]);

  const handleSubmit = async () => {
    if (!invoice) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await invoicesClient.updateInvoice(invoice.id, {
        status: values.status,
        payment_date: values.payment_date ? values.payment_date.format("YYYY-MM-DD") : undefined,
      });

      message.success("Invoice updated");
      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <span className="text-xl font-semibold text-text-primary leading-tight">
          Update Invoice Status
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            Save
          </Button>
        </div>
      }
      width={480}
      destroyOnClose
    >
      {invoice && (
        <div className="mb-4 mt-3 p-3 bg-bg-page rounded-lg">
          <p className="text-sm text-text-muted m-0">
            <span className="font-medium text-text-primary">{invoice.invoice_number}</span>
            {" \u2014 "}
            {invoice.customer.display_name || invoice.customer.legal_name}
          </p>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Status is required" }]}
        >
          <Select options={STATUS_OPTIONS} />
        </Form.Item>

        {status === "paid" && (
          <Form.Item
            name="payment_date"
            label="Payment Date"
            rules={[{ required: true, message: "Payment date is required when status is paid" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
