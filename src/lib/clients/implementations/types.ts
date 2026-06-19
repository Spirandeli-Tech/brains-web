export type Provider = 'github' | 'bitbucket'

export type StepKind =
  | 'move_to_progress'
  | 'research'
  | 'implement'
  | 'open_pr'
  | 'code_review'
  | 'address_feedback'
  | 'qa_notes'
  | 'move_card'

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

export interface ImplementationStep {
  id: string
  kind: StepKind
  /** When true the runner pauses for human approval before executing. */
  sensitive: boolean
  /** Set once the user approved this sensitive step; the runner then executes it. */
  approved?: boolean
  status: StepStatus
  log: string | null
  started_at: string | null
  ended_at: string | null
}

export interface ImplementationRun {
  id: string
  connection_id: string
  /** Denormalized for display (org / connection name). */
  connection_name: string
  provider: Provider
  ticket_url: string
  ticket_key: string
  ticket_summary: string | null
  instructions?: string | null
  status: RunStatus
  worktree_path: string | null
  branch: string | null
  pr_url: string | null
  error?: string | null
  steps: ImplementationStep[]
  created_at: string
  updated_at: string
}

export interface LaunchRunPayload {
  connection_id: string
  ticket_url: string
  /** The steps the user pre-authorized in the Play dialog, in execution order. */
  steps: StepKind[]
  /** Optional free-text guidance passed to the agent. */
  instructions?: string
}

export interface ImplementationStats {
  active: number
  awaiting_approval: number
  completed: number
  failed: number
}
