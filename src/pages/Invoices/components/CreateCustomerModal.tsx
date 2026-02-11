import { useEffect, useState } from "react";
import { Form, Input, Modal, message } from "antd";
import { customersClient } from "@/lib/clients/customers";
import type { CustomerData } from "@/lib/clients/customers";

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (customer: CustomerData) => void;
  customer?: CustomerData | null;
}

export function CreateCustomerModal({
  open,
  onClose,
  onSuccess,
  customer,
}: CreateCustomerModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!customer;

  useEffect(() => {
    if (open && customer) {
      form.setFieldsValue({
        legal_name: customer.legal_name,
        email: customer.email,
        phone: customer.phone,
        address_line_1: customer.address_line_1,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        country: customer.country,
      });
    }
  }, [open, customer, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEditing) {
        const updated = await customersClient.updateCustomer(
          customer.id,
          values,
        );
        message.success("Customer updated");
        form.resetFields();
        onSuccess(updated);
      } else {
        const created = await customersClient.createCustomer(values);
        message.success("Customer created");
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
      title={isEditing ? "Edit Customer" : "New Customer"}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText={isEditing ? "Save" : "Create"}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-5">
        <h4 className="text-sm font-semibold text-text-primary mb-3 mt-0">
          Contact Info
        </h4>
        <Form.Item
          name="legal_name"
          label="Legal Name"
          rules={[{ required: true, message: "Legal name is required" }]}
        >
          <Input placeholder="Company Inc." />
        </Form.Item>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="contact@company.com" />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 (555) 000-0000" />
          </Form.Item>
        </div>

        <h4 className="text-sm font-semibold text-text-primary mb-3 mt-1">
          Address
        </h4>
        <Form.Item name="address_line_1" label="Street Address">
          <Input placeholder="123 Main St" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="city" label="City">
            <Input />
          </Form.Item>

          <Form.Item name="state" label="State">
            <Input />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="zip" label="ZIP">
            <Input />
          </Form.Item>

          <Form.Item name="country" label="Country">
            <Input />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
