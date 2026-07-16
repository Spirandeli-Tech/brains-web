export type WatcherKind =
  | 'github_review_requested'
  | 'github_reviews_received'
  | 'jira_backlog_assigned'
export type WatcherStatus = 'ok' | 'error'

export interface Watcher {
  id: string
  kind: WatcherKind
  connection_id: string | null
  connection_name: string | null
  config: Record<string, unknown>
  interval_minutes: number
  enabled: boolean
  last_run_at: string | null
  last_status: WatcherStatus | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface CreateWatcherPayload {
  kind: WatcherKind
  connection_id?: string
  config?: Record<string, unknown>
  interval_minutes?: number
}

export interface UpdateWatcherPayload {
  connection_id?: string
  config?: Record<string, unknown>
  interval_minutes?: number
  enabled?: boolean
}
