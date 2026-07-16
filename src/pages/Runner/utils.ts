import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import type { QueueDisplayStatus, RunKind } from "@/lib/clients/runner";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const RUNNER_POLL_INTERVAL_MS = 4000;

export const KIND_LABEL: Record<RunKind, string> = {
  automation: "Automation",
  implementation: "Implementation",
  code_review: "Code Review",
  address_pr: "Address PR",
  planner: "Planner",
};

export const KIND_COLOR: Record<RunKind, string> = {
  automation: "purple",
  implementation: "blue",
  code_review: "cyan",
  address_pr: "geekblue",
  planner: "gold",
};

export const STATUS_LABEL: Record<QueueDisplayStatus, string> = {
  running: "Rodando",
  queued: "Na fila",
  waiting: "Aguardando horário",
  awaiting_approval: "Aguardando aprovação",
};

export const STATUS_COLOR: Record<QueueDisplayStatus, string> = {
  running: "processing",
  queued: "default",
  waiting: "warning",
  awaiting_approval: "gold",
};

/** API datetimes are naive UTC — parse them as UTC before comparing to now. */
export function fromUtc(iso: string): dayjs.Dayjs {
  return dayjs.utc(iso).local();
}

/** Human "há 7 min" / "em 2 h" relative to now, from a naive-UTC ISO string. */
export function relative(iso: string | null): string {
  if (!iso) return "—";
  return fromUtc(iso).fromNow();
}

/** Compact elapsed like "7m 12s" since a naive-UTC start instant. */
export function elapsedSince(iso: string | null): string {
  if (!iso) return "—";
  const secs = Math.max(0, dayjs().diff(fromUtc(iso), "second"));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function dueLabel(iso: string | null): string {
  if (!iso) return "";
  return fromUtc(iso).format("DD/MM HH:mm");
}
