export type RunKind =
  | 'automation'
  | 'implementation'
  | 'code_review'
  | 'address_pr'
  | 'planner'

export type QueueDisplayStatus =
  | 'running'
  | 'queued'
  | 'waiting'
  | 'awaiting_approval'

export interface RunnerStatus {
  runner_id: string
  last_seen_at: string
  online: boolean
  seconds_since_last_seen: number
  poll_interval: string | null
  dry_run: boolean | null
  version: string | null
  /** Restart asked for, not yet picked up by a heartbeat. */
  restart_pending: boolean
}

export interface RestartResult {
  runner_id: string
  requested_at: string
  /** In-flight runs failed by the restart. */
  failed_runs: number
}

export interface QueueItem {
  kind: RunKind
  id: string
  title: string
  subtitle: string | null
  connection_name: string | null
  display_status: QueueDisplayStatus
  is_manual: boolean | null
  created_at: string | null
  started_at: string | null
  due_at: string | null
  error: string | null
  /** Route with this run's log/detail, when the kind has one (automations do). */
  url_path: string | null
  can_cancel: boolean
}

export type TerminalStatus = 'done' | 'failed' | 'cancelled'

export interface RecentRun {
  kind: RunKind
  id: string
  title: string
  subtitle: string | null
  connection_name: string | null
  status: TerminalStatus
  finished_at: string | null
  duration_seconds: number | null
  error: string | null
  url_path: string | null
}

export interface RunnerOverview {
  now: string
  runners: RunnerStatus[]
  current: QueueItem[]
  queued: QueueItem[]
  recent: RecentRun[]
}
