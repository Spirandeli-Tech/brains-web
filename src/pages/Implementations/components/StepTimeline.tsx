import { Button, Tag, Tooltip } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  PauseCircleFilled,
  LockOutlined,
} from "@ant-design/icons";
import { stepLabel } from "@/lib/clients/implementations";
import type { ImplementationStep, StepStatus } from "@/lib/clients/implementations";
import { formatRelative, formatDuration, stepStatusLabel } from "./format";

const STATUS_VISUAL: Record<StepStatus, { icon: React.ReactNode; color: string }> = {
  done: { icon: <CheckCircleFilled />, color: "#047857" },
  running: { icon: <LoadingOutlined spin />, color: "#2563EB" },
  awaiting_approval: { icon: <PauseCircleFilled />, color: "#B45309" },
  failed: { icon: <CloseCircleFilled />, color: "#B91C1C" },
  skipped: { icon: <MinusCircleOutlined />, color: "#9CA3AF" },
  pending: { icon: <ClockCircleOutlined />, color: "#9CA3AF" },
};

const STATUS_TAG_COLOR: Record<StepStatus, string> = {
  done: "success",
  running: "processing",
  awaiting_approval: "warning",
  failed: "error",
  skipped: "default",
  pending: "default",
};

interface StepTimelineProps {
  steps: ImplementationStep[];
  onApprove: (stepId: string) => void;
  onStepClick?: (step: ImplementationStep) => void;
  approvingStepId?: string | null;
  nextStepId?: string | null;
}

export function StepTimeline({ steps, onApprove, onStepClick, approvingStepId, nextStepId }: StepTimelineProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, idx) => {
        const visual = STATUS_VISUAL[step.status];
        const isLast = idx === steps.length - 1;
        const isAwaiting = step.status === "awaiting_approval";
        const isNext = step.id === nextStepId;
        const duration = formatDuration(step.started_at, step.ended_at);
        const dimmed = step.status === "pending" && !isNext;
        const clickable = step.status !== "pending" || !!step.log;

        return (
          <div
            key={step.id}
            className={`flex gap-3 ${clickable && onStepClick ? "cursor-pointer group" : ""}`}
            onClick={clickable && onStepClick ? () => onStepClick(step) : undefined}
          >
            {/* Rail */}
            <div className="flex flex-col items-center">
              <span className="text-base leading-none mt-0.5" style={{ color: visual.color }}>
                {visual.icon}
              </span>
              {!isLast && <span className="w-px flex-1 bg-border-divider my-1" />}
            </div>

            {/* Content */}
            <div className={`flex-1 ${isLast ? "" : "pb-4"} ${dimmed ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-text-primary">
                  {stepLabel(step.kind)}
                </span>
                {step.sensitive && (
                  <Tooltip title="Sensitive step — pauses for your approval">
                    <LockOutlined className="text-text-muted text-xs" />
                  </Tooltip>
                )}
                <Tag color={STATUS_TAG_COLOR[step.status]} className="m-0">
                  {stepStatusLabel(step.kind, step.status, isNext)}
                </Tag>
                {duration && (
                  <span className="text-xs text-text-muted">took {duration}</span>
                )}
                {step.status === "running" && step.started_at && (
                  <span className="text-xs text-text-muted">
                    started {formatRelative(step.started_at)}
                  </span>
                )}
                {step.status === "done" && !duration && step.ended_at && (
                  <span className="text-xs text-text-muted">{formatRelative(step.ended_at)}</span>
                )}
              </div>

              {step.log ? (
                <p className="text-xs text-text-muted m-0 mt-1 whitespace-pre-wrap">{step.log}</p>
              ) : (
                step.status === "pending" && (
                  <p className="text-xs text-text-muted m-0 mt-1">
                    {isNext
                      ? "Will run as soon as the previous step finishes."
                      : "Hasn't started yet."}
                  </p>
                )
              )}

              {isAwaiting && (
                <div className="mt-2">
                  <Button
                    type="primary"
                    size="small"
                    loading={approvingStepId === step.id}
                    onClick={() => onApprove(step.id)}
                  >
                    Approve &amp; continue
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
