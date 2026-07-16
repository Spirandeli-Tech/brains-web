export interface PlannerProposal {
  id: string
  created_at: string
  source: string
  title: string
  description: string | null
  action_kind: string
  action_payload: Record<string, unknown>
  status: string
  result_ref: string | null
}

export interface PlannerTicket {
  key: string
  summary: string | null
  status: string | null
  priority: string | null
  type: string | null
  updated: string | null
  url: string | null
}

export interface PlannerBoard {
  tickets?: PlannerTicket[]
  error?: string
  note?: string
}

export interface PlannerHighlight {
  org: string | null
  text: string
  tone: string // urgent | warning | info
}

export interface PlannerRun {
  id: string
  plan_date: string
  status: string
  narrative: string | null
  highlights: PlannerHighlight[] | null
  board_summary: Record<string, PlannerBoard> | null
  claude_cost_usd: number | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface Insights {
  date: string
  run: PlannerRun | null
  proposals: PlannerProposal[]
}
