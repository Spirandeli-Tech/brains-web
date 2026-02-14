import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { transactionCategoriesClient } from "@/lib/clients/transaction-categories";
import type { TransactionCategoryData } from "@/lib/clients/transaction-categories";
import { PageHeader, DataCard } from "@/components/molecules";
import { CategoryModal } from "./components/CategoryModal";

export function CategoriesPage() {
  const [categories, setCategories] = useState<TransactionCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<TransactionCategoryData | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionCategoriesClient.listCategories();
      setCategories(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = (category: TransactionCategoryData) => {
    Modal.confirm({
      title: "Delete Category",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${category.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await transactionCategoriesClient.deleteCategory(category.id);
          message.success("Category deleted");
          fetchCategories();
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete category",
          );
        }
      },
    });
  };

  const handleEdit = (category: TransactionCategoryData) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const columns: ColumnsType<TransactionCategoryData> = [
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      width: 60,
      render: (color: string | null) =>
        color ? (
          <div
            className="w-5 h-5 rounded-full border border-border-subtle"
            style={{ backgroundColor: color }}
          />
        ) : (
          <div className="w-5 h-5 rounded-full border border-border-subtle bg-bg-hover" />
        ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage transaction categories"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Category
          </Button>
        }
      />
      <DataCard>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </DataCard>
      <CategoryModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        category={editingCategory}
      />
    </div>
  );
}
