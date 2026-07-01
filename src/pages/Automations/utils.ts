import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { Automation, AutomationFrequency, AutomationRun, AutomationRunStatus } from "@/lib/clients/automations";

dayjs.extend(utc);

export const AUTOMATION_POLL_INTERVAL_MS = 10000;

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FREQUENCY_LABELS: Record<AutomationFrequency, string> = {
  daily: "Daily",
  weekdays: "Weekdays",
  every_other_weekday: "Every other weekday",
  weekly: "Weekly",
  monthly: "Monthly",
  custom_days: "Custom",
};

export const RUN_STATUS_COLOR: Record<AutomationRunStatus, string> = {
  pending: "default",
  running: "processing",
  done: "success",
  failed: "error",
};

/** Convert a UTC "HH:mm:ss" clock time to a local-timezone dayjs instance, anchored to today. */
export function utcTimeToLocal(timeOfDay: string): dayjs.Dayjs {
  return dayjs.utc(`${dayjs().utc().format("YYYY-MM-DD")}T${timeOfDay}`).local();
}

export function formatFrequency(automation: Automation): string {
  const localTime = utcTimeToLocal(automation.time_of_day).format("HH:mm");
  if (automation.frequency === "daily") return `Daily at ${localTime}`;
  if (automation.frequency === "weekdays") return `Weekdays at ${localTime}`;
  if (automation.frequency === "every_other_weekday") {
    return `Every other weekday at ${localTime}`;
  }
  if (automation.frequency === "weekly" && automation.day_of_week != null) {
    return `Every ${DAY_NAMES[automation.day_of_week]} at ${localTime}`;
  }
  if (automation.frequency === "monthly" && automation.day_of_month != null) {
    return `Monthly on day ${automation.day_of_month} at ${localTime}`;
  }
  if (automation.frequency === "custom_days" && automation.days_of_week?.length) {
    const labels = [...automation.days_of_week]
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(", ");
    return `${labels} at ${localTime}`;
  }
  return FREQUENCY_LABELS[automation.frequency];
}

/**
 * Combine a run's scheduled_for (UTC calendar date) with the automation's time_of_day
 * (UTC clock time) as a single UTC instant, then convert once to local. Converting the
 * date and time separately and recombining would risk a cross-midnight date mismatch.
 */
export function computeDueAt(run: AutomationRun, automation: Automation): dayjs.Dayjs {
  return dayjs.utc(`${run.scheduled_for}T${automation.time_of_day}`).local();
}

export type RunDisplayState = "waiting" | "queued" | "running" | "done" | "failed";

/**
 * Disambiguates the two "pending" sub-states the time-gating fix introduces:
 * "waiting" (non-manual, due-at still in the future) vs "queued" (due now, or manual —
 * the runner just hasn't claimed it yet, normally sub-10s).
 */
export function computeRunDisplayState(run: AutomationRun, automation: Automation): RunDisplayState {
  if (run.status === "running") return "running";
  if (run.status === "done") return "done";
  if (run.status === "failed") return "failed";
  if (run.is_manual) return "queued";
  return computeDueAt(run, automation).isAfter(dayjs()) ? "waiting" : "queued";
}

export function runDisplayLabel(state: RunDisplayState, dueAtLocalLabel?: string): string {
  switch (state) {
    case "waiting":
      return dueAtLocalLabel ? `Waiting until ${dueAtLocalLabel}` : "Waiting";
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
  }
}

export const RUN_DISPLAY_COLOR: Record<RunDisplayState, string> = {
  waiting: "default",
  queued: "default",
  running: "processing",
  done: "success",
  failed: "error",
};
