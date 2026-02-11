import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { servicesClient } from "@/lib/clients/services";
import type { ServiceData } from "@/lib/clients/services";
import { PageHeader, DataCard } from "@/components/molecules";
import { ServiceModal } from "@/pages/Invoices/components/ServiceModal";

function formatAmount(amount: number): string {
  return Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ServicesPage() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null,
  );

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await servicesClient.listServices();
      setServices(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load services",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = (service: ServiceData) => {
    Modal.confirm({
      title: "Delete Service",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${service.service_title}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await servicesClient.deleteService(service.id);
          message.success("Service deleted");
          fetchServices();
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete service",
          );
        }
      },
    });
  };

  const handleEdit = (service: ServiceData) => {
    setEditingService(service);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingService(null);
    fetchServices();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingService(null);
  };

  const columns: ColumnsType<ServiceData> = [
    {
      title: "Service Title",
      dataIndex: "service_title",
      key: "service_title",
    },
    {
      title: "Description",
      dataIndex: "service_description",
      key: "service_description",
      render: (text: string | null) => text || "—",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number) => formatAmount(amount),
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
        title="Services"
        subtitle="Manage your service catalog"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            New Service
          </Button>
        }
      />
      <DataCard>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </DataCard>
      <ServiceModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        service={editingService}
      />
    </div>
  );
}
