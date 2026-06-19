import type { ImplementationRun, StepKind } from "@/lib/clients/implementations";
import { stepLabel } from "@/lib/clients/implementations";

/** Compact relative time, e.g. "just now", "3m ago", "2h ago", "4d ago". */
export function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/** Human duration between two timestamps, e.g. "1m 12s". */
export function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem ? `${mins}m ${rem}s` : `${mins}m`;
}

export interface RunHint {
  tone: "info" | "warning" | "success" | "error" | "neutral";
  title: string;
  detail: string;
}

/** Plain-language explanation of why a run is in its current state. */
export function runStatusHint(run: ImplementationRun): RunHint | null {
  const runningStep = run.steps.find((s) => s.status === "running");
  const awaitingStep = run.steps.find((s) => s.status === "awaiting_approval");
  const nextPending = run.steps.find((s) => s.status === "pending");

  switch (run.status) {
    case "queued":
      return {
        tone: "warning",
        title: "Waiting for a runner to pick this up",
        detail:
          "The run is queued. It stays here until the host runner claims it — make sure the runner process is running on your machine (and RUNNER_TOKEN is set in api/.env). Nothing executes until then.",
      };
    case "running":
      if (runningStep) {
        return {
          tone: "info",
          title: `Running: ${stepLabel(runningStep.kind)}`,
          detail: "A runner has this run and is working through the steps.",
        };
      }
      return {
        tone: "info",
        title: nextPending ? `Up next: ${stepLabel(nextPending.kind)}` : "Resuming…",
        detail: "Claimed by a runner. Moving to the next step.",
      };
    case "awaiting_approval":
      return {
        tone: "warning",
        title: awaitingStep
          ? `Paused — approve "${stepLabel(awaitingStep.kind)}" to continue`
          : "Paused for your approval",
        detail:
          "This is a sensitive step. The runner stopped and is waiting for you. Approve below and it resumes automatically.",
      };
    case "failed":
      return {
        tone: "error",
        title: "Run failed",
        detail: run.error || "A step failed. Check the step logs below.",
      };
    case "cancelled":
      return { tone: "neutral", title: "Run cancelled", detail: "" };
    case "done":
      return null;
    default:
      return null;
  }
}

/** The step the runner will execute next (first pending), for "Next up" marking. */
export function nextPendingStepId(run: ImplementationRun): string | null {
  const active = run.status === "queued" || run.status === "running";
  if (!active) return null;
  const next = run.steps.find((s) => s.status === "pending");
  return next ? next.id : null;
}

export function stepStatusLabel(kind: StepKind, status: string, isNext: boolean): string {
  void kind;
  switch (status) {
    case "pending":
      return isNext ? "Next up" : "Waiting";
    case "running":
      return "Running";
    case "awaiting_approval":
      return "Awaiting approval";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}
