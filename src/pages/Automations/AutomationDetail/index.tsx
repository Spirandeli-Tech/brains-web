import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Collapse, Empty, Spin, Switch, Tag, Tooltip, message } from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import automationsClient from "@/lib/clients/automations";
import type { Automation, AutomationRun } from "@/lib/clients/automations";
import { PageHeader, DataCard, Linkify } from "@/components/molecules";
import {
  AUTOMATION_POLL_INTERVAL_MS,
  RUN_DISPLAY_COLOR,
  computeDueAt,
  computeRunDisplayState,
  formatFrequency,
  runDisplayLabel,
} from "../utils";
import { AutomationFormModal } from "../AutomationFormModal";

const LOG_BLOCK_STYLE = { background: "#0d1117", color: "#e6edf3" } as const;

function RunCard({ run, automation }: { run: AutomationRun; automation: Automation }) {
  const state = computeRunDisplayState(run, automation);
  const dueAtLabel = state === "waiting" ? computeDueAt(run, automation).format("HH:mm") : undefined;

  const collapseItems = run.log
    ? [
        {
          key: "log",
          label: "Full log",
          children: (
            <pre
              className="text-[11px] font-mono rounded overflow-auto whitespace-pre-wrap break-words max-h-96 p-2.5 leading-relaxed"
              style={LOG_BLOCK_STYLE}
            >
              <Linkify text={run.log} linkClassName="text-blue-400 underline" />
            </pre>
          ),
        },
      ]
    : [];

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Tag color={RUN_DISPLAY_COLOR[state]}>{runDisplayLabel(state, dueAtLabel)}</Tag>
        {run.is_manual && <Tag>manual</Tag>}
        <span className="text-sm text-gray-500">{run.scheduled_for}</span>
        {run.started_at && (
          <span className="text-xs text-gray-400">
            started {new Date(run.started_at).toLocaleString()}
          </span>
        )}
        {run.finished_at && (
          <span className="text-xs text-gray-400">
            · finished {new Date(run.finished_at).toLocaleString()}
          </span>
        )}
      </div>

      {run.error && <Alert type="error" showIcon message="Error" description={run.error} />}

      {run.result_summary && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500">Result</p>
            <Tooltip title="Copy to clipboard">
              <Button
                icon={<CopyOutlined />}
                size="small"
                type="text"
                onClick={() => {
                  navigator.clipboard.writeText(run.result_summary ?? "");
                  message.success("Copied to clipboard");
                }}
              />
            </Tooltip>
          </div>
          <pre
            className="text-[11px] font-mono rounded overflow-auto whitespace-pre-wrap break-words max-h-64 p-2.5 leading-relaxed"
            style={LOG_BLOCK_STYLE}
          >
            <Linkify text={run.result_summary} linkClassName="text-blue-400 underline" />
          </pre>
        </div>
      )}

      {collapseItems.length > 0 && <Collapse size="small" ghost items={collapseItems} />}
    </div>
  );
}

export function AutomationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const pollRef = useRef<number | null>(null);

  const fetchAutomation = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      try {
        const data = await automationsClient.getAutomation(id);
        setAutomation(data);
      } catch (error) {
        if (!silent) {
          setNotFound(true);
          message.error(
            error instanceof Error ? error.message : "Failed to load automation"
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchAutomation();
  }, [fetchAutomation]);

  useEffect(() => {
    if (!automation) return;
    const hasActive = automation.recent_runs.some((r) => {
      const state = computeRunDisplayState(r, automation);
      return state === "waiting" || state === "queued" || state === "running";
    });
    if (hasActive) {
      pollRef.current = window.setInterval(
        () => fetchAutomation(true),
        AUTOMATION_POLL_INTERVAL_MS
      );
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [automation, fetchAutomation]);

  const handleToggle = async (enabled: boolean) => {
    if (!id) return;
    setToggling(true);
    try {
      await automationsClient.updateAutomation(id, { enabled });
      await fetchAutomation(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to update automation"
      );
    } finally {
      setToggling(false);
    }
  };

  const handleRun = async () => {
    if (!id) return;
    setRunning(true);
    try {
      await automationsClient.runAutomationNow(id);
      message.success("Run queued, it will start shortly");
      await fetchAutomation(true);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to queue run"
      );
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await automationsClient.deleteAutomation(id);
      message.success("Automation deleted");
      navigate("/automations");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to delete automation"
      );
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          size="small"
          onClick={() => navigate("/automations")}
        >
          Back
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : notFound || !automation ? (
        <Empty description="Automation not found" />
      ) : (
        <>
          <PageHeader
            title={automation.name}
            subtitle={`${automation.skill} · ${formatFrequency(automation)}`}
            actions={
              <div className="flex items-center gap-2">
                <Tooltip title="Run now">
                  <Button
                    icon={<PlayCircleOutlined />}
                    loading={running}
                    onClick={handleRun}
                  >
                    Run Now
                  </Button>
                </Tooltip>
                <Switch
                  checked={automation.enabled}
                  loading={toggling}
                  onChange={handleToggle}
                />
                <Button icon={<EditOutlined />} onClick={() => setEditing(true)} />
                <Tooltip title="Duplicate">
                  <Button icon={<CopyOutlined />} onClick={() => setDuplicating(true)} />
                </Tooltip>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  loading={deleting}
                  onClick={handleDelete}
                />
              </div>
            }
          />

          <DataCard>
            <div className="flex flex-col gap-2">
              <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                {automation.skill}
              </code>
              {automation.instructions && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Instructions</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {automation.instructions}
                  </p>
                </div>
              )}
              {automation.connection_name && (
                <span className="text-xs text-gray-400">
                  Org: {automation.connection_name}
                  {automation.repo_name && ` · Repo: ${automation.repo_name}`}
                </span>
              )}
            </div>
          </DataCard>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-500">
              Runs ({automation.recent_runs.length})
            </h2>
            {automation.recent_runs.length === 0 ? (
              <DataCard>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No runs yet." />
              </DataCard>
            ) : (
              automation.recent_runs.map((run) => (
                <RunCard key={run.id} run={run} automation={automation} />
              ))
            )}
          </div>

          <AutomationFormModal
            open={editing || duplicating}
            automation={editing ? automation : null}
            duplicateFrom={duplicating ? automation : null}
            onClose={() => {
              setEditing(false);
              setDuplicating(false);
            }}
            onSaved={() => {
              const wasDuplicating = duplicating;
              setEditing(false);
              setDuplicating(false);
              if (wasDuplicating) {
                navigate("/automations");
              } else {
                fetchAutomation(true);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
