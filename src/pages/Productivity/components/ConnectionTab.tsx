import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Modal, message } from "antd";
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
      if (result.status === "in_progress") {
        message.info("Sync is already running in the background.");
      } else {
        message.info("Sync started in the background. Data will refresh shortly.");
      }
      // Poll the listing endpoint to detect completion via last_sync_attempted_at
      // (updated on every attempt, success or failure — unlike last_synced_at,
      // which only advances on a clean run and would leave this polling forever
      // on a failed sync), then refresh stats/commits. Caps after ~2 min so a
      // hung backend doesn't keep the UI spinning forever.
      const startedAt = connection.last_sync_attempted_at ?? null;
      let attempts = 0;
      const maxAttempts = 24; // 24 * 5s = 2 min
      const poll = async (): Promise<void> => {
        attempts += 1;
        try {
          const list = await productivityClient.listConnections();
          const updated = list.find((c) => c.id === connection.id);
          const newAttemptedAt = updated?.last_sync_attempted_at ?? null;
          if (newAttemptedAt && newAttemptedAt !== startedAt) {
            fetchData();
            onSyncComplete();
            if (updated?.last_sync_status === "error") {
              message.error(updated.last_sync_error || "Sync failed.");
            } else {
              message.success("Sync completed.");
            }
            setSyncing(false);
            return;
          }
        } catch {
          /* ignore polling errors and try again */
        }
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setSyncing(false);
        }
      };
      setTimeout(poll, 5000);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Sync failed");
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

      {connection.last_sync_status === "error" && connection.last_sync_error && (
        <Alert
          type="error"
          showIcon
          message="Last sync failed"
          description={connection.last_sync_error}
        />
      )}

      <ConnectionStatsCards stats={stats} />
      <CommitsTable commits={commits} loading={loading} />
    </div>
  );
}
