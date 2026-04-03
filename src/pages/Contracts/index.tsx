import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Modal, Table, message } from "antd";
import { ExclamationCircleOutlined, FileAddOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { contractsClient } from "@/lib/clients/contracts";
import type { ContractData, ContractListItem } from "@/lib/clients/contracts";
import { PageHeader, DataCard } from "@/components/molecules";
import { StatusPill } from "@/components/atoms";
import { ContractModal } from "./components/CreateContractModal";

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide m-0">{label}</p>
        <p className="text-2xl font-semibold text-text-primary m-0 mt-1">{value}</p>
      </div>
    </div>
  );
}

function ContractStats({ contracts }: { contracts: ContractListItem[] }) {
  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === "active");
    const annualRevenue = active.reduce((sum, c) => sum + Number(c.annual_value), 0);
    const currency = active[0]?.currency || "USD";
    return {
      activeCount: active.length,
      annualRevenue: formatCurrency(annualRevenue, currency),
      monthlyIncome: formatCurrency(annualRevenue / 12, currency),
    };
  }, [contracts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Active Contracts" value={String(stats.activeCount)} color="#7CB342" />
      <StatCard label="Annual Revenue" value={stats.annualRevenue} color="#42A5F5" />
      <StatCard label="Monthly Income" value={stats.monthlyIncome} color="#AB47BC" />
    </div>
  );
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractData | null>(null);
  const [generateMonth, setGenerateMonth] = useState<dayjs.Dayjs>(dayjs());
  const [generating, setGenerating] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      setContracts(await contractsClient.listContracts());
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleEdit = async (contract: ContractListItem) => {
    try {
      const full = await contractsClient.getContract(contract.id);
      setEditingContract(full);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load contract");
    }
  };

  const handleDelete = (contract: ContractListItem) => {
    Modal.confirm({
      title: "Delete Contract",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${contract.name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await contractsClient.deleteContract(contract.id);
          message.success("Contract deleted");
          fetchContracts();
        } catch (error) {
          message.error(error instanceof Error ? error.message : "Failed to delete contract");
        }
      },
    });
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingContract(null);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingContract(null);
    fetchContracts();
  };

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const result = await contractsClient.generateInvoices(generateMonth.year(), generateMonth.month() + 1);
      if (result.generated > 0) {
        message.success(`${result.generated} invoice(s) generated`);
      } else {
        message.info("All invoices for this month were already generated");
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to generate invoices");
    } finally {
      setGenerating(false);
    }
  };

  const columns: ColumnsType<ContractListItem> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => record.customer.display_name || record.customer.legal_name,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <StatusPill variant={status === "active" ? "success" : "default"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusPill>
      ),
    },
    {
      title: "Annual Value",
      key: "annual_value",
      align: "right",
      render: (_, record) => formatCurrency(record.annual_value, record.currency),
    },
    {
      title: "Monthly Value",
      key: "monthly_value",
      align: "right",
      render: (_, record) => formatCurrency(record.annual_value / 12, record.currency),
    },
    {
      title: "Invoice Day",
      dataIndex: "invoice_day",
      key: "invoice_day",
      render: (day: number) => `Day ${day}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-1">
          <Button type="text" icon={<PlusOutlined style={{ display: "none" }} />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="text" danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Contracts"
        subtitle="Manage customer contracts and recurring invoices"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <DatePicker
                picker="month"
                value={generateMonth}
                onChange={(val) => val && setGenerateMonth(val)}
                allowClear={false}
                size="middle"
              />
              <Button
                icon={<FileAddOutlined />}
                onClick={handleGenerateInvoices}
                loading={generating}
              >
                Generate Invoices
              </Button>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New Contract
            </Button>
          </div>
        }
      />
      <ContractStats contracts={contracts} />
      <DataCard>
        <Table<ContractListItem>
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </DataCard>
      <ContractModal
        open={modalOpen || editingContract !== null}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        contract={editingContract}
      />
    </div>
  );
}
