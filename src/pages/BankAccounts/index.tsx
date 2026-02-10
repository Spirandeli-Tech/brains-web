import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Table, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { bankAccountsClient } from "@/lib/clients/bank-accounts";
import type { BankAccountData } from "@/lib/clients/bank-accounts";
import { CreateBankAccountModal } from "@/pages/Invoices/components/CreateBankAccountModal";

export function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountData | null>(
    null,
  );

  const fetchBankAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bankAccountsClient.listBankAccounts();
      setBankAccounts(data);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to load bank accounts",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleDelete = (account: BankAccountData) => {
    Modal.confirm({
      title: "Delete Bank Account",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${account.label}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await bankAccountsClient.deleteBankAccount(account.id);
          message.success("Bank account deleted");
          fetchBankAccounts();
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete bank account",
          );
        }
      },
    });
  };

  const handleEdit = (account: BankAccountData) => {
    setEditingAccount(account);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingAccount(null);
    fetchBankAccounts();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingAccount(null);
  };

  const columns: ColumnsType<BankAccountData> = [
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Beneficiary",
      dataIndex: "beneficiary_full_name",
      key: "beneficiary_full_name",
    },
    {
      title: "Account #",
      dataIndex: "beneficiary_account_number",
      key: "beneficiary_account_number",
    },
    {
      title: "SWIFT",
      dataIndex: "swift_code",
      key: "swift_code",
    },
    {
      title: "Bank Name",
      dataIndex: "bank_name",
      key: "bank_name",
      render: (text: string | null) => text || "—",
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Bank Account
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          dataSource={bankAccounts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
      <CreateBankAccountModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        bankAccount={editingAccount}
      />
    </div>
  );
}
