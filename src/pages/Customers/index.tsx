import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { customersClient } from "@/lib/clients/customers";
import type { CustomerData } from "@/lib/clients/customers";
import { PageHeader, DataCard } from "@/components/molecules";
import { CreateCustomerModal } from "@/pages/Invoices/components/CreateCustomerModal";

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(
    null,
  );

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customersClient.listCustomers();
      setCustomers(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load customers",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = (customer: CustomerData) => {
    Modal.confirm({
      title: "Delete Customer",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${customer.legal_name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await customersClient.deleteCustomer(customer.id);
          message.success("Customer deleted");
          fetchCustomers();
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete customer",
          );
        }
      },
    });
  };

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCustomer(null);
  };

  const columns: ColumnsType<CustomerData> = [
    {
      title: "Legal Name",
      dataIndex: "legal_name",
      key: "legal_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string | null) => text || "—",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (text: string | null) => text || "—",
    },
    {
      title: "Location",
      key: "location",
      render: (_, record) => {
        const parts = [record.city, record.state, record.country].filter(
          Boolean,
        );
        return parts.length > 0 ? parts.join(", ") : "—";
      },
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
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
        title="Customers"
        subtitle="Manage your customer directory"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            New Customer
          </Button>
        }
      />
      <DataCard>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </DataCard>
      <CreateCustomerModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        customer={editingCustomer}
      />
    </div>
  );
}
