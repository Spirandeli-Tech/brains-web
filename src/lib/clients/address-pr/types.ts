export type Provider = 'github' | 'bitbucket'

export type StepKind = 'fix_draft' | 'commit_push' | 'post_replies'

export type RunStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'done'
  | 'failed'
  | 'cancelled'

export type StepStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'done'
  | 'failed'
  | 'skipped'

export type FixVerdict = 'fix' | 'already_handled' | 'disagree'

export interface FixItem {
  id: string
  path: string
  line: number
  reviewer: string
  quote: string
  verdict: FixVerdict
  summary: string
  reply: string
  apply_fix?: boolean
  post_reply?: boolean
}

export interface FixPlan {
  items: FixItem[]
  commit_message?: string
}

export interface FixStep {
  id: string
  kind: StepKind
  sensitive: boolean
  approved?: boolean
  status: StepStatus
  log: string | null
  started_at: string | null
  ended_at: string | null
}

export interface FixRun {
  id: string
  connection_id: string
  connection_name: string
  provider: Provider
  pr_url: string
  pr_number: string | null
  repo_name: string | null
  ticket_key: string | null
  instructions?: string | null
  claude_model?: string | null
  status: RunStatus
  worktree_path?: string | null
  branch?: string | null
  fix_plan: FixPlan | null
  error?: string | null
  steps: FixStep[]
  created_at: string
  updated_at: string
}

export interface LaunchAddressPrPayload {
  connection_id: string
  pr_url: string
  repo_name?: string
  ticket_key?: string
  instructions?: string
  claude_model?: string
}

export interface AddressPrStats {
  active: number
  awaiting_approval: number
  completed: number
  failed: number
}
