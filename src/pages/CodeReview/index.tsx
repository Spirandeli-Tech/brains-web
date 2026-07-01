import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Input, Select, Spin, message } from "antd";
import { CaretRightFilled, ReloadOutlined } from "@ant-design/icons";
import codeReviewClient, { computeStats } from "@/lib/clients/code-review";
import type { ReviewRun, RunStatus, ReviewAction } from "@/lib/clients/code-review";
import { productivityClient } from "@/lib/clients/productivity";
import type { ConnectionListItem } from "@/lib/clients/productivity";
import { PageHeader, DataCard } from "@/components/molecules";
import { ReviewStats } from "./components/ReviewStats";
import { ReviewCard } from "./components/ReviewCard";
import { LaunchModal } from "./components/LaunchModal";

type RunFilter = "active" | "all" | "awaiting_approval" | "done" | "failed";

const ACTIVE_STATUSES: RunStatus[] = ["queued", "running", "awaiting_approval"];
const POLL_INTERVAL_MS = 8000;

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <span className="font-bold text-xs">GH</span>;
  return <span className="text-xs font-bold">BB</span>;
}

export function CodeReviewPage() {
  const [runs, setRuns] = useState<ReviewRun[]>([]);
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RunFilter>("active");

  const [prUrl, setPrUrl] = useState("");
  const [composerOrg, setComposerOrg] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  const [approvingStepId, setApprovingStepId] = useState<string | null>(null);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [restartingRunId, setRestartingRunId] = useState<string | null>(null);
  const [iteratingRunId, setIteratingRunId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  const fetchRuns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await codeReviewClient.listRuns();
      setRuns(data);
    } catch (err) {
      if (!silent) {
        message.error(err instanceof Error ? err.message : "Failed to load reviews");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    productivityClient.listConnections().then(setConnections).catch(() => {});
    fetchRuns();
  }, [fetchRuns]);

  useEffect(() => {
    pollRef.current = window.setInterval(() => fetchRuns(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchRuns]);

  const handleApprove = async (
    runId: string,
    stepId: string,
    reviewAction: ReviewAction,
    reviewPlan: object | null,
  ) => {
    setApprovingStepId(stepId);
    try {
      await codeReviewClient.approveStep(runId, stepId, {
        review_action: reviewAction,
        review_plan: reviewPlan,
      });
      await fetchRuns(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to approve step");
    } finally {
      setApprovingStepId(null);
    }
  };

  const handleIterate = async (runId: string, stepId: string, notes: string) => {
    setIteratingRunId(runId);
    try {
      await codeReviewClient.iterateStep(runId, stepId, notes);
      await fetchRuns(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to queue iteration");
    } finally {
      setIteratingRunId(null);
    }
  };

  const handleCancel = async (runId: string) => {
    setCancellingRunId(runId);
    try {
      await codeReviewClient.cancelRun(runId);
      message.success("Review cancelado");
      await fetchRuns(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to cancel review");
    } finally {
      setCancellingRunId(null);
    }
  };

  const handleRestart = async (runId: string) => {
    setRestartingRunId(runId);
    try {
      await codeReviewClient.restartRun(runId);
      message.success("Review reiniciado");
      await fetchRuns(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to restart review");
    } finally {
      setRestartingRunId(null);
    }
  };

  const handleLaunched = () => {
    setModalOpen(false);
    setPrUrl("");
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
        title="Code Review"
        subtitle="Cole a URL de um PR, escolha a org e o runner analisa e posta o review com sua aprovação"
        actions={
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cole a URL do PR…"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              style={{ width: 280 }}
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
              Review
            </Button>
          </div>
        }
      />

      <ReviewStats stats={stats} activeFilter={filter} onFilter={handleStatFilter} />

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
              <ReviewCard
                key={run.id}
                run={run}
                onApprove={handleApprove}
                onIterate={handleIterate}
                onCancel={handleCancel}
                onRestart={handleRestart}
                approvingStepId={approvingStepId}
                cancellingRunId={cancellingRunId}
                restartingRunId={restartingRunId}
              />
            ))}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filter === "all"
                ? "Nenhum review ainda."
                : filter === "active"
                ? "Nenhum review ativo. Cole uma URL de PR e clique em Review."
                : `Nenhum review ${filter.replace("_", " ")}.`
            }
          >
            <Button type="primary" icon={<CaretRightFilled />} onClick={() => setModalOpen(true)}>
              Novo review
            </Button>
          </Empty>
        )}
      </DataCard>

      <LaunchModal
        open={modalOpen}
        connections={connections}
        initialPrUrl={prUrl}
        initialConnectionId={composerOrg}
        onClose={() => setModalOpen(false)}
        onLaunched={handleLaunched}
      />
    </div>
  );
}
