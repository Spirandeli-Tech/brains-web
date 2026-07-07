import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Popconfirm,
  Tag,
} from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  DownOutlined,
  GithubOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  PauseCircleFilled,
  PullRequestOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type {
  FixItem,
  FixRun,
  FixStep,
  RunStatus,
  StepStatus,
} from "@/lib/clients/address-pr";
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
  fix_draft: "Análise & correções",
  commit_push: "Commit & push",
  post_replies: "Responder comentários",
};

const VERDICT_TAG: Record<string, { color: string; label: string }> = {
  fix: { color: "blue", label: "Fix" },
  already_handled: { color: "default", label: "Já resolvido" },
  disagree: { color: "orange", label: "Discordo" },
};

function stripFixPlanBlock(log: string): string {
  return log.replace(/```json\s+FIX_PLAN[\s\S]*?```\s*/g, "").trim();
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "github") return <GithubOutlined />;
  return <span className="text-xs font-bold">BB</span>;
}

// ─── Gate 1: which fixes to apply (on fix_draft) ───────────────────────────────

interface FixDraftPanelProps {
  step: FixStep;
  run: FixRun;
  onApprove: (stepId: string, fixPlan: object | null) => void;
  onIterate: (stepId: string, notes: string) => Promise<void>;
  approving: boolean;
}

function FixDraftPanel({ step, run, onApprove, onIterate, approving }: FixDraftPanelProps) {
  const plan = run.fix_plan;
  const [iterateNotes, setIterateNotes] = useState("");
  const [iterating, setIterating] = useState(false);
  const [applyFix, setApplyFix] = useState<boolean[]>(
    () => (plan?.items ?? []).map((i) => i.apply_fix ?? i.verdict === "fix"),
  );

  const handleApprove = () => {
    if (!plan) {
      onApprove(step.id, null);
      return;
    }
    const items: FixItem[] = plan.items.map((item, i) => ({
      ...item,
      apply_fix: item.verdict === "fix" ? applyFix[i] : false,
    }));
    onApprove(step.id, { ...plan, items });
  };

  if (!plan) {
    return (
      <div className="mt-3 flex flex-col gap-2.5">
        <Alert
          type="info"
          showIcon
          message="Rascunho não estruturado"
          description="O rascunho acima não pôde ser parseado. Ao aprovar, os fixes serão comitados como estão."
          className="mb-2"
        />
        <div>
          <Button type="primary" size="small" loading={approving} onClick={handleApprove}>
            Aprovar &amp; comitar
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

  const items = plan.items ?? [];
  const fixCount = items.filter((i) => i.verdict === "fix").length;
  const selectedCount = items.filter((i, idx) => i.verdict === "fix" && applyFix[idx]).length;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">
            Comentários ({selectedCount}/{fixCount} fixes selecionados)
          </span>
          {items.map((item, i) => {
            const verdict = VERDICT_TAG[item.verdict] ?? { color: "default", label: item.verdict };
            const canApply = item.verdict === "fix";
            return (
              <div
                key={item.id ?? i}
                className="flex gap-2 border border-border-subtle rounded-lg p-2.5 bg-bg-subtle"
              >
                <Checkbox
                  checked={canApply ? applyFix[i] : false}
                  disabled={!canApply}
                  onChange={(e) =>
                    setApplyFix((prev) => {
                      const next = [...prev];
                      next[i] = e.target.checked;
                      return next;
                    })
                  }
                  className="mt-0.5 shrink-0"
                />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color={verdict.color} className="m-0">{verdict.label}</Tag>
                    <span className="text-xs font-mono text-text-muted">
                      {item.path}:{item.line}
                    </span>
                    {item.reviewer && (
                      <span className="text-xs text-text-muted">@{item.reviewer}</span>
                    )}
                  </div>
                  {item.quote && (
                    <p className="text-xs text-text-secondary italic m-0">"{item.quote}"</p>
                  )}
                  {item.summary && (
                    <p className="text-xs text-text-primary m-0">{item.summary}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-text-muted m-0">
          Nenhum comentário acionável encontrado — nada para comitar.
        </p>
      )}

      <div>
        <Button type="primary" size="small" loading={approving} onClick={handleApprove}>
          Aprovar &amp; comitar
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

// ─── Gate 2: which replies to post (on commit_push) ────────────────────────────

interface CommitPushPanelProps {
  step: FixStep;
  run: FixRun;
  onApprove: (stepId: string, fixPlan: object | null) => void;
  approving: boolean;
}

function CommitPushPanel({ step, run, onApprove, approving }: CommitPushPanelProps) {
  const plan = run.fix_plan;
  const [postReply, setPostReply] = useState<boolean[]>(
    () => (plan?.items ?? []).map((i) => i.post_reply ?? true),
  );
  const [replyBodies, setReplyBodies] = useState<string[]>(
    () => (plan?.items ?? []).map((i) => i.reply),
  );

  const handleApprove = () => {
    if (!plan) {
      onApprove(step.id, null);
      return;
    }
    const items: FixItem[] = plan.items.map((item, i) => ({
      ...item,
      reply: replyBodies[i] ?? item.reply,
      post_reply: postReply[i],
    }));
    onApprove(step.id, { ...plan, items });
  };

  if (!plan || (plan.items ?? []).length === 0) {
    return (
      <div className="mt-3 flex flex-col gap-2.5">
        <p className="text-xs text-text-muted m-0">
          Nenhuma reply para revisar — as correções já foram comitadas e enviadas.
        </p>
        <div>
          <Button type="primary" size="small" loading={approving} onClick={handleApprove}>
            Confirmar &amp; responder
          </Button>
        </div>
      </div>
    );
  }

  const items = plan.items;
  const selectedCount = items.filter((_, i) => postReply[i]).length;

  return (
    <div className="mt-3 flex flex-col gap-3">
      <Alert
        type="success"
        showIcon
        message="Correções comitadas e enviadas"
        description="Revise o texto de cada reply antes de postar."
        className="mb-1"
      />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary">
          Replies ({selectedCount}/{items.length} selecionadas)
        </span>
        {items.map((item, i) => {
          const verdict = VERDICT_TAG[item.verdict] ?? { color: "default", label: item.verdict };
          return (
            <div
              key={item.id ?? i}
              className="flex gap-2 border border-border-subtle rounded-lg p-2.5 bg-bg-subtle"
            >
              <Checkbox
                checked={postReply[i]}
                onChange={(e) =>
                  setPostReply((prev) => {
                    const next = [...prev];
                    next[i] = e.target.checked;
                    return next;
                  })
                }
                className="mt-0.5 shrink-0"
              />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag color={verdict.color} className="m-0">{verdict.label}</Tag>
                  <span className="text-xs font-mono text-text-muted">
                    {item.path}:{item.line}
                  </span>
                  {item.reviewer && (
                    <span className="text-xs text-text-muted">@{item.reviewer}</span>
                  )}
                </div>
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
                  disabled={!postReply[i]}
                  className="text-xs"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <Button type="primary" size="small" loading={approving} onClick={handleApprove}>
          Aprovar &amp; responder
        </Button>
      </div>
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
        placeholder="e.g. Não corrija o comentário sobre nomenclatura, é intencional…"
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
  step: FixStep;
  run: FixRun;
  isNext: boolean;
  onApprove: (stepId: string, fixPlan: object | null) => void;
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
  const logText = step.log
    ? (step.kind === "fix_draft" ? stripFixPlanBlock(step.log) : step.log)
    : "";

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
          {!step.log && step.status === "pending" && isNext && (
            <p className="text-xs text-text-muted m-0 mb-2">
              Will run as soon as the previous step finishes.
            </p>
          )}
          {step.status === "awaiting_approval" && step.kind === "fix_draft" && (
            <FixDraftPanel
              step={step}
              run={run}
              onApprove={onApprove}
              onIterate={onIterate}
              approving={approvingStepId === step.id}
            />
          )}
          {step.status === "awaiting_approval" && step.kind === "commit_push" && (
            <CommitPushPanel
              step={step}
              run={run}
              onApprove={onApprove}
              approving={approvingStepId === step.id}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── FixCard ──────────────────────────────────────────────────────────────────

interface FixCardProps {
  run: FixRun;
  onApprove: (runId: string, stepId: string, fixPlan: object | null) => void;
  onIterate: (runId: string, stepId: string, notes: string) => Promise<void>;
  onCancel: (runId: string) => void;
  onRestart: (runId: string) => void;
  approvingStepId: string | null;
  cancellingRunId: string | null;
  restartingRunId: string | null;
}

export function FixCard({
  run,
  onApprove,
  onIterate,
  onCancel,
  onRestart,
  approvingStepId,
  cancellingRunId,
  restartingRunId,
}: FixCardProps) {
  const tag = RUN_STATUS_TAG[run.status];
  const isTerminal = run.status === "done" || run.status === "cancelled";
  const canRestart =
    run.status === "running" || run.status === "failed" || run.status === "queued";
  const doneCount = run.steps.filter((s) => s.status === "done" || s.status === "skipped").length;

  const hint = (() => {
    if (run.status === "queued") {
      return { type: "warning" as const, title: "Waiting for runner", detail: "Queued — make sure the runner is running." };
    }
    if (run.status === "running") {
      const s = run.steps.find((s) => s.status === "running");
      return { type: "info" as const, title: s ? `Running: ${STEP_LABEL[s.kind] ?? s.kind}` : "Running…", detail: "" };
    }
    if (run.status === "awaiting_approval") {
      const s = run.steps.find((s) => s.status === "awaiting_approval");
      const detail = s?.kind === "commit_push"
        ? "Correções já comitadas e enviadas — revise as replies abaixo."
        : "Revise o rascunho abaixo, selecione os fixes desejados e aprove.";
      return { type: "warning" as const, title: "Aguardando aprovação", detail };
    }
    if (run.status === "failed") {
      return { type: "error" as const, title: "Run failed", detail: run.error || "A step failed." };
    }
    return null;
  })();

  const nextStepId =
    run.status === "queued" || run.status === "running"
      ? run.steps.find((s) => s.status === "pending")?.id ?? null
      : null;

  const prLabel = run.pr_number ? `#${run.pr_number}` : null;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl shadow-card overflow-hidden">
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
              <span className="text-text-muted">Escopo: </span>
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
            onApprove={(stepId, plan) => onApprove(run.id, stepId, plan)}
            onIterate={(stepId, notes) => onIterate(run.id, stepId, notes)}
            approvingStepId={approvingStepId}
          />
        ))}
      </div>
    </div>
  );
}
