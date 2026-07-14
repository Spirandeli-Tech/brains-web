export interface BriefingEvent {
  id: string
  occurred_at: string
  source: string
  event_type: string
  title: string
  summary: string | null
  connection_name: string | null
  ref_kind: string | null
  ref_id: string | null
  url_path: string | null
  seen_at: string | null
}

export interface AwaitingItem {
  source: string
  ref_id: string
  title: string
  url_path: string
  connection_name: string | null
}

export interface ProposalRead {
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

export interface Briefing {
  date: string
  narrative: string
  awaiting_approval: AwaitingItem[]
  proposals: ProposalRead[]
  done: BriefingEvent[]
  failures: BriefingEvent[]
  timeline: BriefingEvent[]
  unseen_count: number
}
