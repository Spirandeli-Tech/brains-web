import { useCallback, useEffect, useState } from "react";
import { Button, DatePicker, Empty, Tabs, message } from "antd";
import type { TimeRangePickerProps } from "antd";
import { GithubOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { productivityClient } from "@/lib/clients/productivity";
import type { AggregatedStats, ConnectionData, ConnectionListItem } from "@/lib/clients/productivity";
import { PageHeader, DataCard } from "@/components/molecules";
import { ProductivityStats } from "./components/ProductivityStats";
import { ConnectionTab } from "./components/ConnectionTab";
import { ConnectionModal } from "./components/ConnectionModal";
import { LocalActivityCard } from "./components/LocalActivityCard";

const { RangePicker } = DatePicker;

const DEFAULT_STATS: AggregatedStats = {
  total_commits: 0,
  total_prs: 0,
  total_additions: 0,
  total_deletions: 0,
};

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

export function ProductivityPage() {
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats>(DEFAULT_STATS);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("week"),
    dayjs(),
  ]);
  const [activeConnectionId, setActiveConnectionId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        date_from: dateRange[0].format("YYYY-MM-DD"),
        date_to: dateRange[1].format("YYYY-MM-DD"),
      };
      const [conns, stats] = await Promise.all([
        productivityClient.listConnections(),
        productivityClient.getAggregatedStats(filters),
      ]);
      setConnections(conns);
      setAggregatedStats(stats);
      if (conns.length > 0 && !activeConnectionId) {
        setActiveConnectionId(conns[0].id);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load productivity data");
    } finally {
      setLoading(false);
    }
  }, [dateRange[0].valueOf(), dateRange[1].valueOf()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = async (connection: ConnectionListItem) => {
    try {
      const full = await productivityClient.getConnection(connection.id);
      setEditingConnection(full);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load connection");
    }
  };

  const handleDelete = async (connection: ConnectionListItem) => {
    try {
      await productivityClient.deleteConnection(connection.id);
      message.success("Connection deleted");
      if (activeConnectionId === connection.id) {
        setActiveConnectionId("");
      }
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to delete connection");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingConnection(null);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingConnection(null);
    fetchData();
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const rangePresets: TimeRangePickerProps["presets"] = [
    { label: "This week", value: [dayjs().startOf("week"), dayjs()] },
    {
      label: "Last week",
      value: [
        dayjs().subtract(1, "week").startOf("week"),
        dayjs().subtract(1, "week").endOf("week"),
      ],
    },
    { label: "Last 30 days", value: [dayjs().subtract(30, "day"), dayjs()] },
    { label: "This month", value: [dayjs().startOf("month"), dayjs()] },
  ];

  const tabItems = connections.map((conn) => ({
    key: conn.id,
    label: (
      <span className="flex items-center gap-2">
        <ProviderIcon provider={conn.provider} />
        {conn.display_name}
      </span>
    ),
    children: (
      <ConnectionTab
        connection={conn}
        dateRange={dateRange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSyncComplete={fetchData}
      />
    ),
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Productivity"
        subtitle="Track commits, PRs and code changes across your connections"
        actions={
          <div className="flex items-center gap-3">
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              presets={rangePresets}
              allowClear={false}
              size="middle"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              New Connection
            </Button>
          </div>
        }
      />

      <ProductivityStats stats={aggregatedStats} />

      <LocalActivityCard
        dateFrom={dateRange[0].format("YYYY-MM-DD")}
        dateTo={dateRange[1].format("YYYY-MM-DD")}
      />

      {connections.length > 0 ? (
        <DataCard>
          <Tabs
            activeKey={activeConnectionId}
            onChange={setActiveConnectionId}
            items={tabItems}
          />
        </DataCard>
      ) : (
        <DataCard>
          {!loading && (
            <Empty
              description="No connections yet. Create one to start tracking your productivity."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                New Connection
              </Button>
            </Empty>
          )}
        </DataCard>
      )}

      <ConnectionModal
        open={modalOpen || editingConnection !== null}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        connection={editingConnection}
      />
    </div>
  );
}
