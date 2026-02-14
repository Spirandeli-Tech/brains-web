import { useEffect, useState } from "react";
import { ColorPicker, Form, Input, Modal, message } from "antd";
import { transactionCategoriesClient } from "@/lib/clients/transaction-categories";
import type { TransactionCategoryData } from "@/lib/clients/transaction-categories";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: TransactionCategoryData | null;
}

export function CategoryModal({
  open,
  onClose,
  onSuccess,
  category = null,
}: CategoryModalProps) {
  const isEditing = !!category;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && category) {
      form.setFieldsValue({
        name: category.name,
        color: category.color || undefined,
      });
    }
  }, [open, category, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name,
        color:
          typeof values.color === "string"
            ? values.color
            : values.color?.toHexString?.() || null,
      };

      if (isEditing) {
        await transactionCategoriesClient.updateCategory(category.id, payload);
        message.success("Category updated");
      } else {
        await transactionCategoriesClient.createCategory(payload);
        message.success("Category created");
      }

      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Category" : "New Category"}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={submitting}
      destroyOnClose
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Category name is required" }]}
        >
          <Input placeholder="e.g. Software, Marketing, Salary" />
        </Form.Item>

        <Form.Item name="color" label="Color">
          <ColorPicker format="hex" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
