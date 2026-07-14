export type ProposalStatus = 'pending' | 'accepted' | 'dismissed' | 'expired'

export interface Proposal {
  id: string
  created_at: string
  source: string
  title: string
  description: string | null
  action_kind: string
  action_payload: Record<string, unknown>
  status: ProposalStatus
  result_ref: string | null
}
