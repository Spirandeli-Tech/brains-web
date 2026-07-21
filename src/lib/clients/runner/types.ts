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
}

export interface RunnerOverview {
  now: string
  runners: RunnerStatus[]
  current: QueueItem[]
  queued: QueueItem[]
  recent: RecentRun[]
}
