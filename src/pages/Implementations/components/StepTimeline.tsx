import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Tag, Tooltip } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  DownOutlined,
  FileTextOutlined,
  LoadingOutlined,
  LockOutlined,
  MinusCircleOutlined,
  PauseCircleFilled,
  ReloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { stepLabel } from "@/lib/clients/implementations";
import type { ImplementationStep, StepStatus } from "@/lib/clients/implementations";
import { formatDuration, stepStatusLabel } from "./format";
import { Linkify } from "./Linkify";
import { Markdown } from "./Markdown";

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

const BORDER_BY_STATUS: Record<StepStatus, string> = {
  running: "border-blue-200",
  awaiting_approval: "border-amber-200",
  failed: "border-red-200",
  done: "border-border-divider",
  skipped: "border-border-divider",
  pending: "border-border-divider",
};

/** Steps whose logs are generated as Markdown (code review, QA notes, research chat). */
const MARKDOWN_KINDS = new Set(["code_review", "qa_notes", "research"]);

// ─── Research chat ────────────────────────────────────────────────────────────

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

  const blocks = (log || "").split(/\n(?=--- (?:Claude|You) ---)/g).map((block) => {
    const match = block.match(/^--- (Claude|You) ---\n?([\s\S]*)/);
    if (!match) return { role: "system" as const, content: block.trim() };
    return { role: match[1] === "Claude" ? ("claude" as const) : ("user" as const), content: match[2].trim() };
  }).filter((b) => b.content);

  return (
    <div className="flex flex-col mt-2">
      {/* Conversation */}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-2 pr-1">
        {blocks.map((block, i) => (
          <div key={i} className={`flex ${block.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${
              block.role === "claude" ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white"
            }`}>
              {block.role === "claude" && (
                <span className="block text-[10px] font-semibold text-gray-500 mb-0.5">Claude</span>
              )}
              {block.content}
            </div>
          </div>
        ))}
        {!blocks.length && (
          <p className="text-xs text-text-muted text-center py-4">Waiting for Claude to analyze the ticket…</p>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <Input.TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type your reply…"
        autoSize={{ minRows: 2, maxRows: 4 }}
        onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
        disabled={sending || approving}
        className="mb-2"
      />
      <div className="flex gap-2">
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={sending} disabled={!draft.trim() || approving} className="flex-1">
          Send reply
        </Button>
        <Button onClick={onDone} loading={approving} disabled={sending}>
          Done →
        </Button>
      </div>
    </div>
  );
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface PromptPreviewData {
  ticketKey: string;
  ticketUrl: string;
  ticketSummary: string | null;
  instructions?: string | null;
}

interface StepTimelineProps {
  steps: ImplementationStep[];
  onApprove: (stepId: string) => void;
  onIterate?: (stepId: string, notes: string) => Promise<void>;
  onDiscuss?: (stepId: string, message: string) => Promise<void>;
  onShowPrompt?: () => void;
  promptPreview?: PromptPreviewData;
  approvingStepId?: string | null;
  discussingStepId?: string | null;
  nextStepId?: string | null;
}

export function StepTimeline({
  steps,
  onApprove,
  onIterate,
  onDiscuss,
  onShowPrompt,
  promptPreview,
  approvingStepId,
  discussingStepId,
  nextStepId,
}: StepTimelineProps) {
  const implementIdx = steps.findIndex((s) => s.kind === "implement");

  // Auto-expand active/failed steps; user can override by clicking.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const s of steps) {
      if (s.status === "running" || s.status === "awaiting_approval" || s.status === "failed") {
        ids.add(s.id);
      }
    }
    return ids;
  });

  // Expand newly active steps on status changes (polling).
  const statusKey = steps.map((s) => `${s.id}:${s.status}`).join(",");
  useEffect(() => {
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const s of steps) {
        if ((s.status === "running" || s.status === "awaiting_approval" || s.status === "failed") && !next.has(s.id)) {
          next.add(s.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [statusKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Iteration state (per step)
  const [iterateNotes, setIterateNotes] = useState<Record<string, string>>({});
  const [iterating, setIterating] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, idx) => {
        const visual = STATUS_VISUAL[step.status];
        const isExpanded = expanded.has(step.id);
        const isAwaiting = step.status === "awaiting_approval";
        const isResearchChat = step.kind === "research" && isAwaiting;
        const isMarkdown = MARKDOWN_KINDS.has(step.kind);
        const hasContent = !!step.log || isAwaiting;
        const dimmed = step.status === "pending" && step.id !== nextStepId;
        const duration = formatDuration(step.started_at, step.ended_at);
        const isNext = step.id === nextStepId;
        const showPromptBefore = promptPreview && onShowPrompt && idx === implementIdx;

        return (
          <React.Fragment key={step.id}>
            {/* Prompt preview pseudo-step before Implement */}
            {showPromptBefore && (
              <div
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border-divider cursor-pointer hover:bg-bg-hover/50"
                onClick={onShowPrompt}
              >
                <span className="text-base" style={{ color: "#7C3AED" }}>
                  <FileTextOutlined />
                </span>
                <span className="text-sm font-medium text-text-primary flex-1">Prompt de Implementação</span>
                <Tag color="purple" className="m-0">Ver prompt</Tag>
              </div>
            )}

            {/* Step accordion card */}
            <div className={`rounded-lg border overflow-hidden ${BORDER_BY_STATUS[step.status]}`}>
              {/* Header */}
              <div
                className={`flex items-center gap-2.5 px-3 py-2.5 select-none ${
                  hasContent ? "cursor-pointer hover:bg-bg-hover/40" : ""
                } ${dimmed ? "opacity-55" : ""}`}
                onClick={() => hasContent && toggle(step.id)}
              >
                <span className="text-base leading-none shrink-0" style={{ color: visual.color }}>
                  {visual.icon}
                </span>

                <span className={`text-sm flex-1 min-w-0 truncate ${
                  dimmed ? "text-text-muted font-normal" : "text-text-primary font-medium"
                }`}>
                  {stepLabel(step.kind)}
                </span>

                {step.sensitive && (
                  <Tooltip title="Pauses for your approval">
                    <LockOutlined className="text-text-muted text-xs shrink-0" />
                  </Tooltip>
                )}

                <Tag color={STATUS_TAG[step.status]} className="m-0 shrink-0">
                  {stepStatusLabel(step.kind, step.status, isNext)}
                </Tag>

                {duration && (
                  <span className="text-xs text-text-muted shrink-0 hidden sm:inline">took {duration}</span>
                )}

                {hasContent && (
                  <DownOutlined
                    className={`text-[11px] text-text-disabled shrink-0 transition-transform duration-150 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-border-divider px-3 pt-2.5 pb-3">
                  {/* Log output */}
                  {step.log && (
                    <div className={isMarkdown ? "" : "mb-2"}>
                      {isMarkdown ? (
                        <Markdown text={step.log} />
                      ) : (
                        <pre
                          className="text-[11px] font-mono rounded overflow-auto whitespace-pre-wrap break-words max-h-52 p-2.5 leading-relaxed"
                          style={{ background: "#0d1117", color: "#e6edf3" }}
                        >
                          <Linkify text={step.log} linkClassName="text-blue-400 underline" />
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Pending hint when no log yet */}
                  {!step.log && step.status === "pending" && isNext && (
                    <p className="text-xs text-text-muted m-0 mb-2">
                      Will run as soon as the previous step finishes.
                    </p>
                  )}

                  {/* Awaiting approval actions */}
                  {isAwaiting && (
                    isResearchChat ? (
                      <ResearchChatView
                        log={step.log}
                        onSend={(msg) => onDiscuss?.(step.id, msg)}
                        onDone={() => onApprove(step.id)}
                        sending={discussingStepId === step.id}
                        approving={approvingStepId === step.id}
                      />
                    ) : (
                      <div className="mt-3 flex flex-col gap-2.5">
                        <div>
                          <Button
                            type="primary"
                            size="small"
                            loading={approvingStepId === step.id}
                            onClick={(e) => { e.stopPropagation(); onApprove(step.id); }}
                          >
                            Approve &amp; continue
                          </Button>
                        </div>

                        {/* Iterate panel — for open_pr and qa_notes */}
                        {onIterate && (step.kind === "open_pr" || step.kind === "qa_notes") && (
                          <div className="border border-border-divider rounded-lg p-3 bg-bg-subtle">
                            <p className="text-xs font-semibold text-text-secondary mb-1 m-0">
                              {step.kind === "qa_notes" ? "Revise QA comment" : "Iterate before opening PR"}
                            </p>
                            <p className="text-xs text-text-muted mb-2 m-0">
                              {step.kind === "qa_notes"
                                ? "Describe what to change — Claude rewrites the comment and returns here for your approval."
                                : "Describe changes — Claude applies them and returns here for your approval."}
                            </p>
                            <Input.TextArea
                              placeholder="e.g. Also update the unit tests, rename the variable to be clearer…"
                              value={iterateNotes[step.id] ?? ""}
                              onChange={(e) =>
                                setIterateNotes((prev) => ({ ...prev, [step.id]: e.target.value }))
                              }
                              autoSize={{ minRows: 2, maxRows: 5 }}
                              maxLength={2000}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              className="mt-2"
                              size="small"
                              icon={<ReloadOutlined />}
                              loading={iterating === step.id}
                              disabled={!(iterateNotes[step.id] ?? "").trim()}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const notes = (iterateNotes[step.id] ?? "").trim();
                                if (!notes) return;
                                setIterating(step.id);
                                try {
                                  await onIterate(step.id, notes);
                                  setIterateNotes((prev) => ({ ...prev, [step.id]: "" }));
                                } finally {
                                  setIterating(null);
                                }
                              }}
                            >
                              Iterate
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
