import { useState } from "react";
import { Alert, Button, Drawer, Popconfirm, Tag } from "antd";
import {
  GithubOutlined,
  LinkOutlined,
  PullRequestOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { StepTimeline } from "./StepTimeline";
import type { PromptPreviewData } from "./StepTimeline";
import { runStatusHint, nextPendingStepId, formatRelative } from "./format";
import type { ImplementationRun, RunStatus } from "@/lib/clients/implementations";

const RUN_STATUS_TAG: Record<RunStatus, { color: string; label: string }> = {
  queued: { color: "default", label: "Queued" },
  running: { color: "processing", label: "Running" },
  awaiting_approval: { color: "warning", label: "Awaiting approval" },
  done: { color: "success", label: "Done" },
  failed: { color: "error", label: "Failed" },
  cancelled: { color: "default", label: "Cancelled" },
};

const HINT_TYPE = {
  info: "info",
  warning: "warning",
  success: "success",
  error: "error",
  neutral: "info",
} as const;

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

interface RunCardProps {
  run: ImplementationRun;
  onApprove: (runId: string, stepId: string) => void;
  onCancel: (runId: string) => void;
  onRestart: (runId: string) => void;
  onDiscuss: (runId: string, stepId: string, message: string) => Promise<void>;
  onIterate?: (runId: string, stepId: string, notes: string) => Promise<void>;
  approvingStepId?: string | null;
  cancellingRunId?: string | null;
  restartingRunId?: string | null;
  discussingStepId?: string | null;
  iteratingRunId?: string | null;
}


function buildImplementPrompt(data: PromptPreviewData): string {
  const extra = data.instructions
    ? `\n\nAdditional instructions from the developer (follow these closely):\n${data.instructions}`
    : "";
  return (
    `You are implementing Jira ticket ${data.ticketKey} (${data.ticketUrl}).\n` +
    `Summary: ${data.ticketSummary ?? data.ticketKey}\n\n` +
    `Implement the required changes in this repository. When done, stage and ` +
    `commit your work with a clear message referencing the ticket key. ` +
    `Do not push or open a PR — later steps handle that.` +
    extra
  );
}

export function RunCard({
  run,
  onApprove,
  onCancel,
  onRestart,
  onDiscuss,
  onIterate,
  approvingStepId,
  cancellingRunId,
  restartingRunId,
  discussingStepId,
}: RunCardProps) {
  const [promptVisible, setPromptVisible] = useState(false);

  const hasImplementStep = run.steps.some((s) => s.kind === "implement");
  const promptPreview: PromptPreviewData | undefined = hasImplementStep
    ? {
        ticketKey: run.ticket_key,
        ticketUrl: run.ticket_url,
        ticketSummary: run.ticket_summary,
        instructions: run.instructions,
      }
    : undefined;

  const tag = RUN_STATUS_TAG[run.status];
  const isTerminal = run.status === "done" || run.status === "cancelled";
  const canRestart = run.status === "running" || run.status === "failed" || run.status === "queued";
  const hint = runStatusHint(run);
  const nextStepId = nextPendingStepId(run);

  const doneCount = run.steps.filter((s) => s.status === "done" || s.status === "skipped").length;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border-divider">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={run.ticket_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-brand-primary hover:underline"
            >
              {run.ticket_key}
            </a>
            <Tag color={tag.color} className="m-0">
              {tag.label}
            </Tag>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <ProviderIcon provider={run.provider} />
              {run.connection_name}
            </span>
            <span className="text-xs text-text-muted">
              · {doneCount}/{run.steps.length} steps · created {formatRelative(run.created_at)}
            </span>
          </div>
          {run.ticket_summary && (
            <p className="text-sm text-text-secondary m-0 mt-1 truncate">{run.ticket_summary}</p>
          )}
          {run.branch && (
            <p className="text-xs text-text-muted m-0 mt-1 font-mono">{run.branch}</p>
          )}
          {run.instructions && (
            <p className="text-xs text-text-secondary m-0 mt-2 whitespace-pre-wrap border-l-2 border-border-subtle pl-2">
              <span className="text-text-muted">Instructions: </span>
              {run.instructions}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {run.pr_url && (
            <Button
              size="small"
              icon={<PullRequestOutlined />}
              href={run.pr_url}
              target="_blank"
            >
              PR
            </Button>
          )}
          <Button
            size="small"
            icon={<LinkOutlined />}
            href={run.ticket_url}
            target="_blank"
          >
            Ticket
          </Button>
          {canRestart && (
            <Popconfirm
              title="Restart this run?"
              description="All steps will be reset and the run goes back to the queue."
              okText="Restart"
              cancelText="Cancel"
              onConfirm={() => onRestart(run.id)}
            >
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={restartingRunId === run.id}
              />
            </Popconfirm>
          )}
          {!isTerminal && (
            <Popconfirm
              title="Cancel this run?"
              description="The runner will stop after the current step."
              okText="Cancel run"
              okButtonProps={{ danger: true }}
              cancelText="Keep running"
              onConfirm={() => onCancel(run.id)}
            >
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                loading={cancellingRunId === run.id}
              />
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Status hint — explains why the run is in its current state */}
      {hint && (
        <div className="px-4 pt-4">
          <Alert
            type={HINT_TYPE[hint.tone]}
            showIcon
            message={hint.title}
            description={hint.detail || undefined}
          />
        </div>
      )}

      {/* Steps */}
      <div className="p-4">
        <StepTimeline
          steps={run.steps}
          onApprove={(stepId) => onApprove(run.id, stepId)}
          onIterate={onIterate ? (stepId, notes) => onIterate(run.id, stepId, notes) : undefined}
          onDiscuss={(stepId, msg) => onDiscuss(run.id, stepId, msg)}
          onShowPrompt={promptPreview ? () => setPromptVisible(true) : undefined}
          promptPreview={promptPreview}
          approvingStepId={approvingStepId}
          discussingStepId={discussingStepId}
          nextStepId={nextStepId}
        />
      </div>

      {/* Prompt preview drawer */}
      <Drawer
        title="Prompt de Implementação"
        open={promptVisible}
        onClose={() => setPromptVisible(false)}
        width={640}
        styles={{ body: { padding: 0 } }}
      >
        {promptPreview && (
          <pre
            className="m-0 p-4 text-xs font-mono overflow-auto whitespace-pre-wrap break-words h-full"
            style={{ background: "#0d1117", color: "#e6edf3", minHeight: "100%" }}
          >
            {buildImplementPrompt(promptPreview)}
          </pre>
        )}
      </Drawer>

    </div>
  );
}
