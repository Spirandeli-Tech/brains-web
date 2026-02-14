import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Modal,
  Segmented,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { transactionsClient } from "@/lib/clients/transactions";
import type {
  TransactionContext,
  TransactionData,
  TransactionFilters,
  TransactionListItem,
  TransactionSummary,
  TransactionType,
} from "@/lib/clients/transactions";
import { transactionCategoriesClient } from "@/lib/clients/transaction-categories";
import type { TransactionCategoryData } from "@/lib/clients/transaction-categories";
import { bankAccountsClient } from "@/lib/clients/bank-accounts";
import type { BankAccountData } from "@/lib/clients/bank-accounts";
import { PageHeader, DataCard } from "@/components/molecules";
import { TransactionModal } from "./components/TransactionModal";

const { RangePicker } = DatePicker;

type ContextOption = "all" | TransactionContext;

function formatCurrency(amount: number, currency = "BRL"): string {
  return `${currency} ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function FinancePage() {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TransactionSummary>({
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    transaction_count: 0,
  });

  // Filters
  const [contextFilter, setContextFilter] = useState<ContextOption>("business");
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [bankAccountFilter, setBankAccountFilter] = useState<
    string | undefined
  >();
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionData | null>(null);

  // Dropdown data
  const [categories, setCategories] = useState<TransactionCategoryData[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);

  useEffect(() => {
    transactionCategoriesClient.listCategories().then(setCategories);
    bankAccountsClient.listBankAccounts().then(setBankAccounts);
  }, []);

  const buildFilters = useCallback((): TransactionFilters => {
    const filters: TransactionFilters = {};
    if (contextFilter !== "all") filters.context = contextFilter;
    if (typeFilter) filters.type = typeFilter;
    if (categoryFilter) filters.category_id = categoryFilter;
    if (bankAccountFilter) filters.bank_account_id = bankAccountFilter;
    if (dateRange?.[0]) filters.date_from = dateRange[0].format("YYYY-MM-DD");
    if (dateRange?.[1]) filters.date_to = dateRange[1].format("YYYY-MM-DD");
    return filters;
  }, [contextFilter, typeFilter, categoryFilter, bankAccountFilter, dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = buildFilters();
      const [txns, sum] = await Promise.all([
        transactionsClient.listTransactions(filters),
        transactionsClient.getSummary(filters),
      ]);
      setTransactions(txns);
      setSummary(sum);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (transaction: TransactionListItem) => {
    Modal.confirm({
      title: "Delete Transaction",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${transaction.description}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await transactionsClient.deleteTransaction(transaction.id);
          message.success("Transaction deleted");
          fetchData();
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : "Failed to delete transaction",
          );
        }
      },
    });
  };

  const handleEdit = async (transaction: TransactionListItem) => {
    try {
      const full = await transactionsClient.getTransaction(transaction.id);
      setEditingTransaction(full);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to load transaction",
      );
    }
  };

  const handleCreate = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingTransaction(null);
    fetchData();
    // Refresh categories in case they were created inline later
    transactionCategoriesClient.listCategories().then(setCategories);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  const columns: ColumnsType<TransactionListItem> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Category",
      key: "category",
      width: 150,
      render: (_, record) =>
        record.category ? (
          <Tag
            color={record.category.color || undefined}
            className="rounded-md"
          >
            {record.category.name}
          </Tag>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      title: "Bank Account",
      key: "bank_account",
      width: 160,
      render: (_, record) =>
        record.bank_account ? (
          record.bank_account.label
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      title: "Type",
      key: "type",
      width: 100,
      render: (_, record) =>
        record.type === "income" ? (
          <span className="text-green-600 flex items-center gap-1">
            <ArrowUpOutlined /> Income
          </span>
        ) : (
          <span className="text-red-500 flex items-center gap-1">
            <ArrowDownOutlined /> Expense
          </span>
        ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 140,
      align: "right",
      render: (_, record) => (
        <span
          className={`font-medium ${record.type === "income" ? "text-green-600" : "text-red-500"}`}
        >
          {record.type === "income" ? "+" : "-"}
          {formatCurrency(record.amount, record.currency)}
        </span>
      ),
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

  const isModalOpen = modalOpen || editingTransaction !== null;

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Track income & expenses"
        actions={
          <div className="flex items-center gap-3">
            <Segmented
              value={contextFilter}
              onChange={(val) => setContextFilter(val as ContextOption)}
              options={[
                { label: "Business", value: "business" },
                { label: "Personal", value: "personal" },
                { label: "All", value: "all" },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              New Transaction
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <DataCard>
          <div className="text-sm text-text-muted mb-1">Total Income</div>
          <div className="text-xl font-semibold text-green-600">
            +{formatCurrency(summary.total_income)}
          </div>
        </DataCard>
        <DataCard>
          <div className="text-sm text-text-muted mb-1">Total Expenses</div>
          <div className="text-xl font-semibold text-red-500">
            -{formatCurrency(summary.total_expenses)}
          </div>
        </DataCard>
        <DataCard>
          <div className="text-sm text-text-muted mb-1">Net Balance</div>
          <div
            className={`text-xl font-semibold ${summary.net_balance >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {summary.net_balance >= 0 ? "+" : ""}
            {formatCurrency(summary.net_balance)}
          </div>
        </DataCard>
      </div>

      {/* Filter Bar */}
      <DataCard className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            allowClear
            placeholder="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-32"
            options={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
            ]}
          />
          <Select
            allowClear
            placeholder="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-44"
            options={categories.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
          />
          <Select
            allowClear
            placeholder="Bank Account"
            value={bankAccountFilter}
            onChange={setBankAccountFilter}
            className="w-44"
            options={bankAccounts.map((ba) => ({
              label: ba.label,
              value: ba.id,
            }))}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
          />
        </div>
      </DataCard>

      {/* Table */}
      <DataCard>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </DataCard>

      <TransactionModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        transaction={editingTransaction}
        defaultContext={contextFilter === "all" ? "business" : contextFilter}
      />
    </div>
  );
}
