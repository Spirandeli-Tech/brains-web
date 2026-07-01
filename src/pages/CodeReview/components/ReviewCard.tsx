import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  DownOutlined,
  GithubOutlined,
  LinkOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  PauseCircleFilled,
  PullRequestOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type {
  ReviewRun,
  ReviewStep,
  RunStatus,
  StepStatus,
  ReviewAction,
  ReviewComment,
  ReviewReply,
} from "@/lib/clients/code-review";
import { Markdown } from "@/pages/Implementations/components/Markdown";
import { formatRelative, formatDuration } from "@/pages/Implementations/components/format";

const RUN_STATUS_TAG: Record<RunStatus, { color: string; label: string }> = {
  queued: { color: "default", label: "Queued" },
  running: { color: "processing", label: "Running" },
  awaiting_approval: { color: "warning", label: "Awaiting approval" },
  done: { color: "success", label: "Done" },
  failed: { color: "error", label: "Failed" },
  cancelled: { color: "default", label: "Cancelled" },
};

const STATUS_VISUAL: Record<StepStatus, { icon: React.ReactNode; color: string }> = {
  done: { icon: <CheckCircleFilled />, color: "#047857" },
  running: { icon: <LoadingOutlined spin />, color: "#2563EB" },
  awaiting_approval: { icon: <PauseCircleFilled />, color: "#B45309" },
  failed: { icon: <CloseCircleFilled />, color: "#B91C1C" },
  skipped: { icon: <MinusCircleOutlined />, color: "#9CA3AF" },
  pending: { icon: <ClockCircleOutlined />, color: "#9CA3AF" },
};

const STATUS_TAG: Record<StepStatus, string> = {
  done: "success",
  running: "processing",
  awaiting_approval: "warning",
  failed: "error",
  skipped: "default",
  pending: "default",
};

const STEP_LABEL: Record<string, string> = {
  review_draft: "Análise do PR",
  post_review: "Postar review",
};

function prepareLog(log: string, kind: string): { text: string; reviewAction: string | null } {
  if (kind !== "review_draft") return { text: log, reviewAction: null };
  // Strip the raw REVIEW_PLAN JSON fence — stored in run.review_plan, not for human reading
  const withoutBlock = log.replace(/```json\s+REVIEW_PLAN[\s\S]*?```\s*/g, "");
  // Extract and remove the bold "Review action:" summary line for dedicated display
  const m = withoutBlock.match(/\*{0,2}Review action:\*{0,2}[^\n]*/i);
  const reviewAction = m
    ? m[0].replace(/^\*{0,2}Review action:\*{0,2}\s*/i, "").replace(/\*+$/, "").trim()
    : null;
  const text = withoutBlock.replace(/\*{0,2}Review action:\*{0,2}[^\n]*\n?/gi, "").trim();
  return { text, reviewAction };
}

const REVIEW_ACTION_OPTS: { label: string; value: ReviewAction }[] = [
  { label: "Approve", value: "approve" },
  { label: "Request changes", value: "request_changes" },
  { label: "Comment", value: "comment" },
];

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

interface ApprovalPanelProps {
  step: ReviewStep;
  run: ReviewRun;
  onApprove: (stepId: string, reviewAction: ReviewAction, reviewPlan: object | null) => void;
  onIterate: (stepId: string, notes: string) => Promise<void>;
  approving: boolean;
}

function ApprovalPanel({ step, run, onApprove, onIterate, approving }: ApprovalPanelProps) {
  const plan = run.review_plan;
  const [reviewAction, setReviewAction] = useState<ReviewAction>(
    (plan?.action as ReviewAction) ?? "comment",
  );
  const [iterateNotes, setIterateNotes] = useState("");
  const [iterating, setIterating] = useState(false);

  // Checkbox state: comments
  const [checkedComments, setCheckedComments] = useState<boolean[]>(
    () => (plan?.comments ?? []).map(() => true),
  );
  // Checkbox state: replies
  const [checkedReplies, setCheckedReplies] = useState<boolean[]>(
    () => (plan?.replies ?? []).map(() => true),
  );
  // Editable bodies
  const [commentBodies, setCommentBodies] = useState<string[]>(
    () => (plan?.comments ?? []).map((c) => c.body),
  );
  const [replyBodies, setReplyBodies] = useState<string[]>(
    () => (plan?.replies ?? []).map((r) => r.body),
  );

  const handleApprove = () => {
    if (!plan) {
      onApprove(step.id, reviewAction, null);
      return;
    }
    const filteredComments: ReviewComment[] = (plan.comments ?? [])
      .filter((_, i) => checkedComments[i])
      .map((c, i) => ({ ...c, body: commentBodies[i] ?? c.body }));
    const filteredReplies: ReviewReply[] = (plan.replies ?? [])
      .filter((_, i) => checkedReplies[i])
      .map((r, i) => ({ ...r, body: replyBodies[i] ?? r.body }));
    onApprove(step.id, reviewAction, {
      action: reviewAction,
      comments: filteredComments,
      replies: filteredReplies,
    });
  };

  // Fallback: no structured plan — show raw log + simple approve button
  if (!plan) {
    return (
      <div className="mt-3 flex flex-col gap-2.5">
        <Alert
          type="info"
          showIcon
          message="Rascunho não estruturado"
          description="O rascunho acima não pôde ser parseado. Ao aprovar, o review será postado integralmente."
          className="mb-2"
        />
        <div className="flex items-center gap-2">
          <Select
            value={reviewAction}
            onChange={setReviewAction}
            options={REVIEW_ACTION_OPTS}
            style={{ width: 180 }}
            size="small"
          />
          <Button
            type="primary"
            size="small"
            loading={approving}
            onClick={handleApprove}
          >
            Aprovar &amp; postar
          </Button>
        </div>
        <IterateSection
          stepId={step.id}
          notes={iterateNotes}
          setNotes={setIterateNotes}
          onIterate={onIterate}
          iterating={iterating}
          setIterating={setIterating}
        />
      </div>
    );
  }

  const comments = plan.comments ?? [];
  const replies = plan.replies ?? [];

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Action selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-secondary">Ação:</span>
        <Select
          value={reviewAction}
          onChange={setReviewAction}
          options={REVIEW_ACTION_OPTS}
          style={{ width: 180 }}
          size="small"
        />
      </div>

      {/* Comment checkboxes */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">
            Comentários ({comments.filter((_, i) => checkedComments[i]).length}/{comments.length} selecionados)
          </span>
          {comments.map((c, i) => (
            <div
              key={i}
              className="flex gap-2 border border-border-subtle rounded-lg p-2.5 bg-bg-subtle"
            >
              <Checkbox
                checked={checkedComments[i]}
                onChange={(e) =>
                  setCheckedComments((prev) => {
                    const next = [...prev];
                    next[i] = e.target.checked;
                    return next;
                  })
                }
                className="mt-0.5 shrink-0"
              />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-xs font-mono text-text-muted">
                  {c.path}:{c.line} ({c.side})
                </span>
                <Input.TextArea
                  value={commentBodies[i]}
                  onChange={(e) =>
                    setCommentBodies((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  disabled={!checkedComments[i]}
                  className="text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply checkboxes */}
      {replies.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">
            Replies ({replies.filter((_, i) => checkedReplies[i]).length}/{replies.length} selecionados)
          </span>
          {replies.map((r, i) => (
            <div
              key={i}
              className="flex gap-2 border border-border-subtle rounded-lg p-2.5 bg-bg-subtle"
            >
              <Checkbox
                checked={checkedReplies[i]}
                onChange={(e) =>
                  setCheckedReplies((prev) => {
                    const next = [...prev];
                    next[i] = e.target.checked;
                    return next;
                  })
                }
                className="mt-0.5 shrink-0"
              />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-xs text-text-muted">Reply to #{r.comment_id}</span>
                <Input.TextArea
                  value={replyBodies[i]}
                  onChange={(e) =>
                    setReplyBodies((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={!checkedReplies[i]}
                  className="text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && replies.length === 0 && (
        <p className="text-xs text-text-muted m-0">
          Nenhum comentário ou reply no rascunho — o review será submetido como está.
        </p>
      )}

      <div>
        <Button type="primary" size="small" loading={approving} onClick={handleApprove}>
          Aprovar &amp; postar
        </Button>
      </div>

      <IterateSection
        stepId={step.id}
        notes={iterateNotes}
        setNotes={setIterateNotes}
        onIterate={onIterate}
        iterating={iterating}
        setIterating={setIterating}
      />
    </div>
  );
}

function IterateSection({
  stepId,
  notes,
  setNotes,
  onIterate,
  iterating,
  setIterating,
}: {
  stepId: string;
  notes: string;
  setNotes: (v: string) => void;
  onIterate: (stepId: string, notes: string) => Promise<void>;
  iterating: boolean;
  setIterating: (v: boolean) => void;
}) {
  return (
    <div className="border border-border-divider rounded-lg p-3 bg-bg-subtle">
      <p className="text-xs font-semibold text-text-secondary mb-1 m-0">Revisar rascunho</p>
      <p className="text-xs text-text-muted mb-2 m-0">
        Descreva o que mudar — Claude reescreve o rascunho e volta aqui para aprovação.
      </p>
      <Input.TextArea
        placeholder="e.g. Adicione um comentário sobre o custo da query na linha 42…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 5 }}
        maxLength={2000}
      />
      <Button
        className="mt-2"
        size="small"
        icon={<ReloadOutlined />}
        loading={iterating}
        disabled={!notes.trim()}
        onClick={async () => {
          const n = notes.trim();
          if (!n) return;
          setIterating(true);
          try {
            await onIterate(stepId, n);
            setNotes("");
          } finally {
            setIterating(false);
          }
        }}
      >
        Iterar
      </Button>
    </div>
  );
}

// ─── Step row ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: ReviewStep;
  run: ReviewRun;
  isNext: boolean;
  onApprove: (stepId: string, reviewAction: ReviewAction, reviewPlan: object | null) => void;
  onIterate: (stepId: string, notes: string) => Promise<void>;
  approvingStepId: string | null;
}

function StepRow({ step, run, isNext, onApprove, onIterate, approvingStepId }: StepRowProps) {
  const [expanded, setExpanded] = useState(
    step.status === "awaiting_approval" || step.status === "running" || step.status === "failed",
  );

  const visual = STATUS_VISUAL[step.status];
  const hasContent = !!step.log || step.status === "awaiting_approval";
  const dimmed = step.status === "pending" && !isNext;
  const duration = formatDuration(step.started_at, step.ended_at);
  const { text: logText, reviewAction } = step.log
    ? prepareLog(step.log, step.kind)
    : { text: "", reviewAction: null };

  return (
    <div
      className="rounded-lg border border-border-subtle overflow-hidden"
      style={{ borderLeftColor: visual.color, borderLeftWidth: 3 }}
    >
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 select-none ${
          hasContent ? "cursor-pointer hover:bg-bg-hover/40" : ""
        } ${dimmed ? "opacity-55" : ""}`}
        onClick={() => hasContent && setExpanded((v) => !v)}
      >
        <span className="text-base leading-none shrink-0" style={{ color: visual.color }}>
          {visual.icon}
        </span>
        <span
          className={`text-sm flex-1 min-w-0 truncate ${
            dimmed ? "text-text-muted font-normal" : "text-text-primary font-medium"
          }`}
        >
          {STEP_LABEL[step.kind] ?? step.kind}
        </span>
        <Tag color={STATUS_TAG[step.status]} className="m-0 shrink-0">
          {step.status === "pending" && isNext
            ? "Next up"
            : step.status === "awaiting_approval"
            ? "Aguardando aprovação"
            : step.status.charAt(0).toUpperCase() + step.status.slice(1)}
        </Tag>
        {duration && (
          <span className="text-xs text-text-muted shrink-0 hidden sm:inline">
            took {duration}
          </span>
        )}
        {hasContent && (
          <DownOutlined
            className={`text-[11px] text-text-disabled shrink-0 transition-transform duration-150 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border-divider px-3 pt-2.5 pb-3">
          {logText && (
            <div className="mb-2">
              <Markdown text={logText} />
            </div>
          )}
          {reviewAction && (
            <div className="mt-1 mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 m-0 mb-0.5">
                Review action
              </p>
              <p className="text-xs text-amber-900 m-0 font-medium">{reviewAction}</p>
            </div>
          )}
          {!step.log && step.status === "pending" && isNext && (
            <p className="text-xs text-text-muted m-0 mb-2">
              Will run as soon as the previous step finishes.
            </p>
          )}
          {step.status === "awaiting_approval" && step.kind === "review_draft" && (
            <ApprovalPanel
              step={step}
              run={run}
              onApprove={onApprove}
              onIterate={onIterate}
              approving={approvingStepId === step.id}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

interface ReviewCardProps {
  run: ReviewRun;
  onApprove: (runId: string, stepId: string, reviewAction: ReviewAction, reviewPlan: object | null) => void;
  onIterate: (runId: string, stepId: string, notes: string) => Promise<void>;
  onCancel: (runId: string) => void;
  onRestart: (runId: string) => void;
  approvingStepId: string | null;
  cancellingRunId: string | null;
  restartingRunId: string | null;
}

export function ReviewCard({
  run,
  onApprove,
  onIterate,
  onCancel,
  onRestart,
  approvingStepId,
  cancellingRunId,
  restartingRunId,
}: ReviewCardProps) {
  const tag = RUN_STATUS_TAG[run.status];
  const isTerminal = run.status === "done" || run.status === "cancelled";
  const canRestart =
    run.status === "running" || run.status === "failed" || run.status === "queued";
  const doneCount = run.steps.filter((s) => s.status === "done" || s.status === "skipped").length;

  // Status hint
  const hint = (() => {
    if (run.status === "queued") {
      return { type: "warning" as const, title: "Waiting for runner", detail: "Queued — make sure the runner is running." };
    }
    if (run.status === "running") {
      const s = run.steps.find((s) => s.status === "running");
      return { type: "info" as const, title: s ? `Running: ${STEP_LABEL[s.kind] ?? s.kind}` : "Running…", detail: "" };
    }
    if (run.status === "awaiting_approval") {
      return { type: "warning" as const, title: "Aguardando aprovação", detail: "Revise o rascunho abaixo, selecione os itens desejados e aprove." };
    }
    if (run.status === "failed") {
      return { type: "error" as const, title: "Run failed", detail: run.error || "A step failed." };
    }
    return null;
  })();

  // Next pending step id
  const nextStepId =
    run.status === "queued" || run.status === "running"
      ? run.steps.find((s) => s.status === "pending")?.id ?? null
      : null;

  // PR number display
  const prLabel = run.pr_number ? `#${run.pr_number}` : null;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border-divider">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {prLabel && (
              <a
                href={run.pr_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                {prLabel}
              </a>
            )}
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
          {run.repo_name && (
            <p className="text-xs text-text-muted m-0 mt-1 font-mono">{run.repo_name}</p>
          )}
          {run.ticket_key && (
            <p className="text-xs text-text-secondary m-0 mt-1">Ticket: {run.ticket_key}</p>
          )}
          {run.instructions && (
            <p className="text-xs text-text-secondary m-0 mt-2 whitespace-pre-wrap border-l-2 border-border-subtle pl-2">
              <span className="text-text-muted">Focus: </span>
              {run.instructions}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="small"
            icon={<PullRequestOutlined />}
            href={run.pr_url}
            target="_blank"
          >
            PR
          </Button>
          {canRestart && (
            <Popconfirm
              title="Restart this review?"
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
              title="Cancel this review?"
              okText="Cancel review"
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

      {hint && (
        <div className="px-4 pt-4">
          <Alert type={hint.type} showIcon message={hint.title} description={hint.detail || undefined} />
        </div>
      )}

      <div className="p-4 flex flex-col gap-1.5">
        {run.steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            run={run}
            isNext={step.id === nextStepId}
            onApprove={(stepId, action, plan) => onApprove(run.id, stepId, action, plan)}
            onIterate={(stepId, notes) => onIterate(run.id, stepId, notes)}
            approvingStepId={approvingStepId}
          />
        ))}
      </div>
    </div>
  );
}
