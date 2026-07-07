export type AutomationFrequency =
  | 'daily'
  | 'weekdays'
  | 'every_other_weekday'
  | 'weekly'
  | 'monthly'
  | 'custom_days'
export type AutomationRunStatus = 'pending' | 'running' | 'done' | 'failed'

export interface AutomationRun {
  id: string
  scheduled_for: string
  status: AutomationRunStatus
  is_manual: boolean
  log: string | null
  result_summary: string | null
  error: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface Automation {
  id: string
  name: string
  skill: string
  instructions: string | null
  connection_name: string | null
  repo_name: string | null
  frequency: AutomationFrequency
  day_of_week: number | null
  day_of_month: number | null
  days_of_week: number[] | null
  time_of_day: string
  enabled: boolean
  created_at: string
  recent_runs: AutomationRun[]
}

export interface CreateAutomationPayload {
  name: string
  skill: string
  instructions?: string
  connection_name?: string
  repo_name?: string
  frequency: AutomationFrequency
  day_of_week?: number
  day_of_month?: number
  days_of_week?: number[]
  time_of_day?: string
}

export interface UpdateAutomationPayload {
  name?: string
  skill?: string
  instructions?: string
  connection_name?: string
  repo_name?: string
  frequency?: AutomationFrequency
  day_of_week?: number
  day_of_month?: number
  days_of_week?: number[]
  time_of_day?: string
  enabled?: boolean
}

export interface RepoInfo {
  name: string
  base_branch: string
}

export interface ConnectionInfo {
  name: string
  repos: RepoInfo[]
}
