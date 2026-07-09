import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Collapse,
  Empty,
  Spin,
  Switch,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import automationsClient from "@/lib/clients/automations";
import type { Automation, AutomationRun } from "@/lib/clients/automations";
import { PageHeader, DataCard } from "@/components/molecules";
import { AUTOMATION_POLL_INTERVAL_MS, RUN_STATUS_COLOR, formatFrequency } from "./utils";
import { AutomationFormModal } from "./AutomationFormModal";

function RunRow({ run }: { run: AutomationRun }) {
  return (
    <div className="flex items-center gap-3 py-1 text-sm">
      <Tag color={RUN_STATUS_COLOR[run.status]}>{run.status}</Tag>
      {run.is_manual && <Tag>manual</Tag>}
      <span className="text-gray-500">{run.scheduled_for}</span>
      {run.error && (
        <Tooltip title={run.error}>
          <span className="text-red-500 truncate max-w-xs">{run.error}</span>
        </Tooltip>
      )}
    </div>
  );
}

function AutomationCard({
  automation,
  onToggle,
  onDelete,
  onRun,
  onEdit,
  onDuplicate,
  toggling,
  deleting,
  running,
}: {
  automation: Automation;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
  onEdit: (automation: Automation) => void;
  onDuplicate: (automation: Automation) => void;
  toggling: string | null;
  deleting: string | null;
  running: string | null;
}) {
  const hasActiveRuns = automation.recent_runs.some(
    (r) => r.status === "pending" || r.status === "running"
  );

  const collapseItems =
    automation.recent_runs.length > 0
      ? [
          {
            key: "runs",
            label: `Recent runs (${automation.recent_runs.length})`,
            children: (
              <div className="flex flex-col gap-1">
                {automation.recent_runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </div>
            ),
          },
        ]
      : [];

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasActiveRuns && <Badge status="processing" />}
            <Link
              to={`/automations/${automation.id}`}
              className="font-medium truncate hover:underline"
            >
              {automation.name}
            </Link>
          </div>
          <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
            {automation.skill}
          </code>
          <span className="text-xs text-gray-500">{formatFrequency(automation)}</span>
          {automation.instructions && (
            <Tooltip title={automation.instructions}>
              <span className="text-xs text-gray-400 truncate max-w-xs">
                Instructions: {automation.instructions}
              </span>
            </Tooltip>
          )}
          {automation.connection_name && (
            <span className="text-xs text-gray-400">
              Org: {automation.connection_name}
              {automation.repo_name && ` · Repo: ${automation.repo_name}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip title="Run now">
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              loading={running === automation.id}
              onClick={() => onRun(automation.id)}
            />
          </Tooltip>
          <Switch
            checked={automation.enabled}
            loading={toggling === automation.id}
            onChange={(checked) => onToggle(automation.id, checked)}
            size="small"
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(automation)}
          />
          <Tooltip title="Duplicate">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => onDuplicate(automation)}
            />
          </Tooltip>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleting === automation.id}
            onClick={() => onDelete(automation.id)}
          />
        </div>
      </div>

      {collapseItems.length > 0 && (
        <Collapse size="small" ghost items={collapseItems} />
      )}
    </div>
  );
}

export function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [duplicatingFrom, setDuplicatingFrom] = useState<Automation | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  const fetchAutomations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await automationsClient.listAutomations();
      setAutomations(data);
    } catch (error) {
      if (!silent) {
        message.error(
          error instanceof Error ? error.message : "Failed to load automations"
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  useEffect(() => {
    const hasActive = automations.some((a) =>
      a.recent_runs.some((r) => r.status === "pending" || r.status === "running")
    );
    if (hasActive) {
      pollRef.current = window.setInterval(
        () => fetchAutomations(true),
        AUTOMATION_POLL_INTERVAL_MS
      );
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [automations, fetchAutomations]);

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggling(id);
    try {
      await automationsClient.updateAutomation(id, { enabled });
      await fetchAutomations(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to update automation"
      );
    } finally {
      setToggling(null);
    }
  };

  const handleRun = async (id: string) => {
    setRunning(id);
    try {
      await automationsClient.runAutomationNow(id);
      message.success("Run queued, it will start shortly");
      await fetchAutomations(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to queue run"
      );
    } finally {
      setRunning(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await automationsClient.deleteAutomation(id);
      message.success("Automation deleted");
      await fetchAutomations(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to delete automation"
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Automations"
        subtitle="Schedule Claude Code skills to run automatically on a recurring schedule"
        actions={
          <div className="flex items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => fetchAutomations()}
              loading={loading}
            >
              Reload
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Automation
            </Button>
          </div>
        }
      />

      <DataCard>
        {loading && automations.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : automations.length > 0 ? (
          <div className="flex flex-col gap-3">
            {automations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onRun={handleRun}
                onEdit={setEditingAutomation}
                onDuplicate={setDuplicatingFrom}
                toggling={toggling}
                deleting={deleting}
                running={running}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No automations yet."
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Automation
            </Button>
          </Empty>
        )}
      </DataCard>

      <AutomationFormModal
        open={modalOpen || !!editingAutomation || !!duplicatingFrom}
        automation={editingAutomation}
        duplicateFrom={duplicatingFrom}
        onClose={() => {
          setModalOpen(false);
          setEditingAutomation(null);
          setDuplicatingFrom(null);
        }}
        onSaved={() => {
          setModalOpen(false);
          setEditingAutomation(null);
          setDuplicatingFrom(null);
          fetchAutomations(true);
        }}
      />
    </div>
  );
}
