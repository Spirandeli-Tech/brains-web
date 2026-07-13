export type Provider = 'github' | 'bitbucket'

export type StepKind = 'review_draft' | 'post_review'

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

export type ReviewAction = 'approve' | 'request_changes' | 'comment'

export interface ReviewComment {
  path: string
  line: number
  side: 'LEFT' | 'RIGHT'
  body: string
}

export interface ReviewReply {
  comment_id: number
  body: string
}

export interface ReviewPlan {
  action: ReviewAction
  comments: ReviewComment[]
  replies: ReviewReply[]
}

export interface ReviewStep {
  id: string
  kind: StepKind
  sensitive: boolean
  approved?: boolean
  status: StepStatus
  log: string | null
  started_at: string | null
  ended_at: string | null
}

export interface ReviewRun {
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
  review_action: ReviewAction | null
  review_plan: ReviewPlan | null
  error?: string | null
  steps: ReviewStep[]
  created_at: string
  updated_at: string
}

export interface LaunchReviewPayload {
  connection_id: string
  pr_url: string
  repo_name?: string
  ticket_key?: string
  instructions?: string
  claude_model?: string
}

export interface ReviewStats {
  active: number
  awaiting_approval: number
  completed: number
  failed: number
}
