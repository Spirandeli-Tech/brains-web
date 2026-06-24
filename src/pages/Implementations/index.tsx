import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Select,
  Spin,
  message,
} from "antd";
import { CaretRightFilled, GithubOutlined, ReloadOutlined } from "@ant-design/icons";
import implementationsClient, { computeStats } from "@/lib/clients/implementations";
import type { ImplementationRun, RunStatus } from "@/lib/clients/implementations";
import { productivityClient } from "@/lib/clients/productivity";
import type { ConnectionListItem } from "@/lib/clients/productivity";
import { PageHeader, DataCard } from "@/components/molecules";
import { ImplementationStats } from "./components/ImplementationStats";
import { RunCard } from "./components/RunCard";
import { LaunchModal } from "./components/LaunchModal";

type RunFilter = "active" | "all" | "awaiting_approval" | "done" | "failed";

const ACTIVE_STATUSES: RunStatus[] = ["queued", "running", "awaiting_approval"];
const POLL_INTERVAL_MS = 8000;

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

export function ImplementationsPage() {
  const [runs, setRuns] = useState<ImplementationRun[]>([]);
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RunFilter>("active");
  const [usingMock, setUsingMock] = useState(false);

  // Inline composer state (header)
  const [ticketUrl, setTicketUrl] = useState("");
  const [composerOrg, setComposerOrg] = useState<string>("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Per-action loading
  const [approvingStepId, setApprovingStepId] = useState<string | null>(null);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [restartingRunId, setRestartingRunId] = useState<string | null>(null);
  const [discussingStepId, setDiscussingStepId] = useState<string | null>(null);
  const [iteratingRunId, setIteratingRunId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  const fetchRuns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await implementationsClient.listRuns();
      setRuns(data);
      setUsingMock(!implementationsClient.isApiAvailable());
    } catch (error) {
      if (!silent) {
        message.error(error instanceof Error ? error.message : "Failed to load runs");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    productivityClient.listConnections().then(setConnections).catch(() => {});
    fetchRuns();
  }, [fetchRuns]);

  // Lightweight polling so in-flight runs update on their own.
  useEffect(() => {
    pollRef.current = window.setInterval(() => fetchRuns(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchRuns]);

  const handleApprove = async (runId: string, stepId: string) => {
    setApprovingStepId(stepId);
    try {
      await implementationsClient.approveStep(runId, stepId);
      await fetchRuns(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to approve step");
    } finally {
      setApprovingStepId(null);
    }
  };

  const handleCancel = async (runId: string) => {
    setCancellingRunId(runId);
    try {
      await implementationsClient.cancelRun(runId);
      message.success("Run cancelled");
      await fetchRuns(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to cancel run");
    } finally {
      setCancellingRunId(null);
    }
  };

  const handleDiscuss = async (runId: string, stepId: string, userMessage: string) => {
    setDiscussingStepId(stepId);
    try {
      await implementationsClient.discussStep(runId, stepId, userMessage);
      await fetchRuns(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setDiscussingStepId(null);
    }
  };

  const handleIterate = async (runId: string, stepId: string, notes: string) => {
    setIteratingRunId(runId);
    try {
      await implementationsClient.iterateStep(runId, stepId, notes);
      await fetchRuns(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to queue iteration");
    } finally {
      setIteratingRunId(null);
    }
  };

  const handleRestart = async (runId: string) => {
    setRestartingRunId(runId);
    try {
      await implementationsClient.restartRun(runId);
      message.success("Run restarted");
      await fetchRuns(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to restart run");
    } finally {
      setRestartingRunId(null);
    }
  };

  const handleLaunched = () => {
    setModalOpen(false);
    setTicketUrl("");
    setFilter("active");
    fetchRuns(true);
  };

  const stats = useMemo(() => computeStats(runs), [runs]);

  const filteredRuns = useMemo(() => {
    if (filter === "all") return runs;
    if (filter === "active") return runs.filter((r) => ACTIVE_STATUSES.includes(r.status));
    if (filter === "awaiting_approval") return runs.filter((r) => r.status === "awaiting_approval");
    if (filter === "done") return runs.filter((r) => r.status === "done");
    if (filter === "failed") return runs.filter((r) => r.status === "failed");
    return runs;
  }, [runs, filter]);

  const handleStatFilter = (value: string) => {
    setFilter((prev) => (prev === value ? "all" : (value as RunFilter)));
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Implementations"
        subtitle="Run a ticket end to end — implement, PR, review, QA — with approval on sensitive steps"
        actions={
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste ticket URL…"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <Select
              placeholder="Org"
              value={composerOrg || undefined}
              onChange={setComposerOrg}
              style={{ width: 170 }}
              options={connections.map((c) => ({ label: c.display_name, value: c.id }))}
              optionRender={(opt) => {
                const conn = connections.find((c) => c.id === opt.value);
                return (
                  <span className="flex items-center gap-2">
                    {conn && <ProviderIcon provider={conn.provider} />}
                    {opt.label}
                  </span>
                );
              }}
            />
            <Button
              type="primary"
              icon={<CaretRightFilled />}
              onClick={() => setModalOpen(true)}
            >
              Play
            </Button>
          </div>
        }
      />

      {usingMock && (
        <Alert
          type="info"
          showIcon
          message="Preview data"
          description="The backend module isn't running yet, so this shows sample runs. It switches to live data automatically once /implementations endpoints respond."
        />
      )}

      <ImplementationStats stats={stats} activeFilter={filter} onFilter={handleStatFilter} />

      <DataCard>
        <div className="flex items-center justify-end mb-4">
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => fetchRuns()}
            loading={loading}
          >
            Reload
          </Button>
        </div>

        {loading && runs.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : filteredRuns.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredRuns.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                onApprove={handleApprove}
                onCancel={handleCancel}
                onRestart={handleRestart}
                onDiscuss={handleDiscuss}
                onIterate={handleIterate}
                approvingStepId={approvingStepId}
                cancellingRunId={cancellingRunId}
                restartingRunId={restartingRunId}
                discussingStepId={discussingStepId}
                iteratingRunId={iteratingRunId}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filter === "all"
                ? "No runs yet."
                : filter === "active"
                ? "No active runs. Paste a ticket URL and hit Play."
                : `No ${filter.replace("_", " ")} runs.`
            }
          >
            <Button type="primary" icon={<CaretRightFilled />} onClick={() => setModalOpen(true)}>
              New implementation
            </Button>
          </Empty>
        )}
      </DataCard>

      <LaunchModal
        open={modalOpen}
        connections={connections}
        initialTicketUrl={ticketUrl}
        initialConnectionId={composerOrg}
        onClose={() => setModalOpen(false)}
        onLaunched={handleLaunched}
      />
    </div>
  );
}
