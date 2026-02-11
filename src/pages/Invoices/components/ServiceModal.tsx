import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, message } from "antd";
import { servicesClient } from "@/lib/clients/services";
import type { ServiceData } from "@/lib/clients/services";

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (service: ServiceData) => void;
  service?: ServiceData | null;
}

export function ServiceModal({
  open,
  onClose,
  onSuccess,
  service,
}: ServiceModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!service;

  useEffect(() => {
    if (open && service) {
      form.setFieldsValue({
        service_title: service.service_title,
        service_description: service.service_description,
        amount: Number(service.amount),
      });
    }
  }, [open, service, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEditing) {
        const updated = await servicesClient.updateService(service.id, {
          service_title: values.service_title,
          service_description: values.service_description || undefined,
          amount: values.amount,
        });
        message.success("Service updated");
        form.resetFields();
        onSuccess(updated);
      } else {
        const created = await servicesClient.createService({
          service_title: values.service_title,
          service_description: values.service_description || undefined,
          amount: values.amount,
        });
        message.success("Service created");
        form.resetFields();
        onSuccess(created);
      }
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
    onClose();
  };

  return (
    <Modal
      title={
        <span className="text-xl font-semibold text-text-primary leading-tight">
          {isEditing ? "Edit Service" : "New Service"}
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
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-3">
        <Form.Item
          name="service_title"
          label="Service Title"
          rules={[
            { required: true, message: "Service title is required" },
          ]}
        >
          <Input placeholder="Web Development Services" />
        </Form.Item>

        <Form.Item name="service_description" label="Service Description">
          <Input.TextArea
            rows={3}
            placeholder="Description of services rendered..."
          />
        </Form.Item>

        {/* Amount Card */}
        <div className="border border-border-subtle rounded-xl p-4 mt-1">
          <div className="flex items-center justify-between gap-6">
            <div className="shrink-0">
              <p className="text-sm font-semibold text-text-primary m-0">
                Amount
              </p>
              <p className="text-xs text-text-muted m-0 mt-0.5">
                Enter the service price
              </p>
            </div>
            <Form.Item
              name="amount"
              className="!mb-0"
              rules={[
                { required: true, message: "Amount is required" },
                {
                  type: "number",
                  min: 0.01,
                  message: "Amount must be greater than 0",
                },
              ]}
            >
              <InputNumber
                className="!w-44 [&_input]:!text-right"
                min={0.01}
                step={0.01}
                precision={2}
                controls={false}
                placeholder="0.00"
                style={{ height: 48, fontSize: 18, fontWeight: 600 }}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
