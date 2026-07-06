export type Provider = 'github' | 'bitbucket'

export type StepKind =
  | 'enrich_ticket'
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
  /** Which repo this step targets, for multi-repo runs. Null = ticket-level step. */
  repo_name: string | null
  started_at: string | null
  ended_at: string | null
}

/** One PR opened as part of a cascade run (Ecointeractive). */
export interface PrTarget {
  repo_name: string
  stage: string
  branch: string
  base_branch: string
  pr_url: string
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
  iteration_notes?: string | null
  repo_name: string | null
  /** Multiple repos selected for this run (e.g. Ecointeractive). Takes precedence over repo_name. */
  repo_names: string[] | null
  base_branch: string | null
  /** Cascade environment chain derived from the ticket's Fix Version, e.g. ["staging", "qa", "development"]. */
  cascade_stages: string[] | null
  /** PRs opened across all repos/stages of a cascade run. */
  pr_targets: PrTarget[] | null
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
  /** Which repo within the connection to use. Defaults to the first if omitted. */
  repo_name?: string
  /** Multiple repos to target in the same run (e.g. Ecointeractive tickets that touch several repos). */
  repo_names?: string[]
  /** Base branch for the PR. Defaults to the repo's configured base_branch. */
  base_branch?: string
}

export interface RepoInfo {
  name: string
  base_branch: string
}

export interface ImplementationStats {
  active: number
  awaiting_approval: number
  completed: number
  failed: number
}
