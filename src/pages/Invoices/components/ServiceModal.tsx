import { useEffect, useState } from "react";
import { Button, Form, Input, Modal, message } from "antd";
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
        });
        message.success("Service updated");
        form.resetFields();
        onSuccess(updated);
      } else {
        const created = await servicesClient.createService({
          service_title: values.service_title,
          service_description: values.service_description || undefined,
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

        <Form.Item name="service_description" label="Service Description" className="mb-0">
          <Input.TextArea
            rows={3}
            placeholder="Description of services rendered..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
