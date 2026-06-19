import { useEffect, useRef, useState } from "react";
import { Alert, Button, Drawer, Input, Popconfirm, Tag } from "antd";
import { SendOutlined } from "@ant-design/icons";
import {
  GithubOutlined,
  LinkOutlined,
  PullRequestOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { StepTimeline } from "./StepTimeline";
import { runStatusHint, nextPendingStepId, formatRelative, formatDuration, stepStatusLabel } from "./format";
import { stepLabel } from "@/lib/clients/implementations";
import type { ImplementationRun, ImplementationStep, RunStatus, StepStatus } from "@/lib/clients/implementations";

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
  approvingStepId?: string | null;
  cancellingRunId?: string | null;
  restartingRunId?: string | null;
  discussingStepId?: string | null;
}

const STEP_STATUS_TAG: Record<StepStatus, { color: string; label: string }> = {
  done: { color: "success", label: "Done" },
  running: { color: "processing", label: "Running" },
  awaiting_approval: { color: "warning", label: "Awaiting approval" },
  failed: { color: "error", label: "Failed" },
  skipped: { color: "default", label: "Skipped" },
  pending: { color: "default", label: "Pending" },
};

function ResearchChatView({
  log,
  onSend,
  onDone,
  sending,
  approving,
}: {
  log: string | null;
  onSend: (msg: string) => void;
  onDone: () => void;
  sending: boolean;
  approving: boolean;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const handleSend = () => {
    const msg = draft.trim();
    if (!msg) return;
    setDraft("");
    onSend(msg);
  };

  // Parse log into message blocks: "--- Claude ---" or "--- You ---"
  const blocks = (log || "").split(/\n(?=--- (?:Claude|You) ---)/g).map((block) => {
    const match = block.match(/^--- (Claude|You) ---\n?([\s\S]*)/);
    if (!match) return { role: "system" as const, content: block.trim() };
    return { role: match[1] === "Claude" ? ("claude" as const) : ("user" as const), content: match[2].trim() };
  }).filter((b) => b.content);

  return (
    <div className="flex flex-col h-full">
      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
        {blocks.map((block, i) => (
          <div key={i} className={`flex ${block.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                block.role === "claude"
                  ? "bg-gray-100 text-gray-900"
                  : "bg-blue-600 text-white"
              }`}
            >
              {block.role === "claude" && (
                <span className="block text-xs font-semibold text-gray-500 mb-1">Claude</span>
              )}
              {block.content}
            </div>
          </div>
        ))}
        {!blocks.length && (
          <p className="text-sm text-text-muted text-center py-8">Waiting for Claude to analyze the ticket…</p>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-divider p-3 flex flex-col gap-2 shrink-0">
        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your reply…"
          autoSize={{ minRows: 2, maxRows: 6 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          disabled={sending || approving}
        />
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!draft.trim() || approving}
            className="flex-1"
          >
            Send reply
          </Button>
          <Button
            onClick={onDone}
            loading={approving}
            disabled={sending}
          >
            Done discussing, implement →
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepDetailDrawer({
  step,
  onClose,
  onApproveStep,
  onDiscussStep,
  approvingStepId,
  discussingStepId,
}: {
  step: ImplementationStep | null;
  onClose: () => void;
  onApproveStep: (stepId: string) => void;
  onDiscussStep: (stepId: string, message: string) => Promise<void>;
  approvingStepId?: string | null;
  discussingStepId?: string | null;
}) {
  const logRef = useRef<HTMLPreElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const el = logRef.current;
    if (el && atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [step?.log]);

  const tag = step ? STEP_STATUS_TAG[step.status] : null;
  const isRunning = step?.status === "running";
  const isResearchChat = step?.kind === "research" && step?.status === "awaiting_approval";
  const duration = step ? formatDuration(step.started_at, step.ended_at) : null;

  return (
    <Drawer
      title={
        step ? (
          <div className="flex items-center gap-2">
            <span>{stepLabel(step.kind)}</span>
            {tag && <Tag color={tag.color} className="m-0">{stepStatusLabel(step.kind, step.status, false)}</Tag>}
            {isRunning && (
              <span className="flex items-center gap-1 text-xs text-blue-500 font-normal">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        ) : null
      }
      open={!!step}
      onClose={onClose}
      width={640}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      {step && (
        <div className="flex flex-col h-full">
          {/* Metadata bar */}
          {!isResearchChat && (
            <div className="flex gap-4 px-4 py-2 border-b border-border-divider text-xs text-text-muted bg-bg-subtle shrink-0">
              {step.started_at && <span>Started {formatRelative(step.started_at)}</span>}
              {duration && <span>Duration: {duration}</span>}
              {!step.started_at && <span>Not started yet</span>}
            </div>
          )}

          {/* Research: chat interface */}
          {isResearchChat ? (
            <ResearchChatView
              log={step.log}
              onSend={(msg) => onDiscussStep(step.id, msg)}
              onDone={() => onApproveStep(step.id)}
              sending={discussingStepId === step.id}
              approving={approvingStepId === step.id}
            />
          ) : (
            /* Log view for all other steps */
            <pre
              ref={logRef}
              className="flex-1 m-0 p-4 text-xs font-mono overflow-auto whitespace-pre-wrap break-words"
              style={{ background: "#0d1117", color: "#e6edf3", minHeight: 0 }}
              onScroll={(e) => {
                const el = e.currentTarget;
                atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              }}
            >
              {step.log || (isRunning ? "Waiting for output…" : "No output.")}
            </pre>
          )}
        </div>
      )}
    </Drawer>
  );
}

export function RunCard({
  run,
  onApprove,
  onCancel,
  onRestart,
  onDiscuss,
  approvingStepId,
  cancellingRunId,
  restartingRunId,
  discussingStepId,
}: RunCardProps) {
  const [selectedStep, setSelectedStep] = useState<ImplementationStep | null>(null);

  // Keep drawer in sync with polling updates
  useEffect(() => {
    if (!selectedStep) return;
    const updated = run.steps.find((s) => s.id === selectedStep.id);
    if (updated) setSelectedStep(updated);
  }, [run.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

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
          onStepClick={setSelectedStep}
          approvingStepId={approvingStepId}
          nextStepId={nextStepId}
        />
      </div>

      <StepDetailDrawer
        step={selectedStep}
        onClose={() => setSelectedStep(null)}
        onApproveStep={(stepId) => onApprove(run.id, stepId)}
        onDiscussStep={(stepId, message) => onDiscuss(run.id, stepId, message)}
        approvingStepId={approvingStepId}
        discussingStepId={discussingStepId}
      />
    </div>
  );
}
