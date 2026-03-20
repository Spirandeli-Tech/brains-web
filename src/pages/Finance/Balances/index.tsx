import { useCallback, useEffect, useState } from "react";
import { Segmented, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { transactionsClient } from "@/lib/clients/transactions";
import type {
  BankAccountBalance,
  TransactionContext,
} from "@/lib/clients/transactions";
import { usersClient } from "@/lib/clients/users";
import { PageHeader, DataCard } from "@/components/molecules";

type ContextOption = "all" | TransactionContext;

function formatCurrency(amount: number, currency = "USD"): string {
  return `${currency} ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BalancesPage() {
  const [balances, setBalances] = useState<BankAccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [contextFilter, setContextFilter] = useState<ContextOption>("business");

  useEffect(() => {
    usersClient.getPreferences().then((prefs) => {
      if (prefs.default_currency) setDefaultCurrency(prefs.default_currency);
    });
  }, []);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    try {
      const context =
        contextFilter === "all" ? undefined : contextFilter;
      const data = await transactionsClient.getBankBalances(context);
      setBalances(data);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load balances",
      );
    } finally {
      setLoading(false);
    }
  }, [contextFilter]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const columns: ColumnsType<BankAccountBalance> = [
    {
      title: "Bank Account",
      dataIndex: "bank_account_label",
      key: "bank_account_label",
    },
    {
      title: "Total Income",
      key: "total_income",
      align: "right",
      render: (_, record) => (
        <span className="text-green-600 font-medium">
          +{formatCurrency(record.total_income, defaultCurrency)}
        </span>
      ),
    },
    {
      title: "Total Expenses",
      key: "total_expenses",
      align: "right",
      render: (_, record) => (
        <span className="text-red-500 font-medium">
          -{formatCurrency(record.total_expenses, defaultCurrency)}
        </span>
      ),
    },
    {
      title: "Balance",
      key: "balance",
      align: "right",
      render: (_, record) => (
        <span
          className={`font-semibold ${record.balance >= 0 ? "text-green-600" : "text-red-500"}`}
        >
          {record.balance >= 0 ? "+" : ""}
          {formatCurrency(record.balance, defaultCurrency)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bank Balances"
        subtitle="Account balances based on transactions"
        actions={
          <Segmented
            value={contextFilter}
            onChange={(val) => setContextFilter(val as ContextOption)}
            options={[
              { label: "Business", value: "business" },
              { label: "Personal", value: "personal" },
              { label: "All", value: "all" },
            ]}
          />
        }
      />
      <DataCard>
        <Table
          columns={columns}
          dataSource={balances}
          rowKey="bank_account_id"
          loading={loading}
          pagination={false}
        />
      </DataCard>
    </div>
  );
}
