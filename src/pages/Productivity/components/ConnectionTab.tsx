import { useCallback, useEffect, useState } from "react";
import { Button, Modal, message } from "antd";
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, SyncOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { productivityClient } from "@/lib/clients/productivity";
import type { CommitData, ConnectionListItem, ConnectionStats, ProductivityFilters } from "@/lib/clients/productivity";
import { ConnectionStatsCards } from "./ConnectionStatsCards";
import { CommitsTable } from "./CommitsTable";

dayjs.extend(relativeTime);

interface ConnectionTabProps {
  connection: ConnectionListItem;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  onEdit: (connection: ConnectionListItem) => void;
  onDelete: (connection: ConnectionListItem) => void;
  onSyncComplete: () => void;
}

export function ConnectionTab({ connection, dateRange, onEdit, onDelete, onSyncComplete }: ConnectionTabProps) {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const filters: ProductivityFilters = {
    date_from: dateRange[0].format("YYYY-MM-DD"),
    date_to: dateRange[1].format("YYYY-MM-DD"),
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, commitsData] = await Promise.all([
        productivityClient.getConnectionStats(connection.id, filters),
        productivityClient.getCommits(connection.id, filters),
      ]);
      setStats(statsData);
      setCommits(commitsData);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [connection.id, dateRange[0].valueOf(), dateRange[1].valueOf()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await productivityClient.syncConnection(connection.id);
      if (result.errors.length > 0) {
        message.warning(`Synced with ${result.errors.length} error(s)`);
      } else {
        message.success(`Synced: ${result.commits_synced} commits, ${result.prs_synced} PRs`);
      }
      fetchData();
      onSyncComplete();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Connection",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${connection.display_name}"? All synced data will be removed.`,
      okText: "Delete",
      okType: "danger",
      onOk: () => onDelete(connection),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button icon={<SyncOutlined spin={syncing} />} onClick={handleSync} loading={syncing}>
            Sync
          </Button>
          <Button icon={<EditOutlined />} onClick={() => onEdit(connection)}>
            Edit
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
            Delete
          </Button>
        </div>
        <span className="text-sm text-text-muted">
          {connection.last_synced_at
            ? `Last synced: ${dayjs(connection.last_synced_at).fromNow()}`
            : "Never synced"}
        </span>
      </div>

      <ConnectionStatsCards stats={stats} />
      <CommitsTable commits={commits} loading={loading} />
    </div>
  );
}
