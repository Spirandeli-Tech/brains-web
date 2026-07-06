export type Provider = 'github' | 'bitbucket'
export type PullRequestStatus = 'open' | 'merged' | 'declined' | 'closed'

export interface ConnectionData {
  id: string
  provider: Provider
  username: string
  workspace: string | null
  contract_id: string | null
  custom_name: string | null
  display_name: string
  pat_masked: string
  selected_repos: string[] | null
  is_primary: boolean
  last_synced_at: string | null
  last_sync_attempted_at: string | null
  last_sync_status: 'success' | 'error' | null
  last_sync_error: string | null
  created_at: string
  updated_at: string
}

export interface ConnectionListItem {
  id: string
  provider: Provider
  display_name: string
  username: string
  workspace: string | null
  contract_id: string | null
  selected_repos: string[] | null
  is_primary: boolean
  last_synced_at: string | null
  last_sync_attempted_at: string | null
  last_sync_status: 'success' | 'error' | null
  last_sync_error: string | null
  created_at: string
}

export interface ConnectionCreatePayload {
  provider: Provider
  pat: string
  username: string
  workspace?: string
  contract_id?: string
  custom_name?: string
  selected_repos?: string[]
  is_primary?: boolean
}

export interface ListReposRequest {
  provider: Provider
  pat: string
  username: string
  workspace?: string
}

export interface ConnectionUpdatePayload {
  pat?: string
  username?: string
  workspace?: string
  contract_id?: string
  custom_name?: string
  selected_repos?: string[]
  is_primary?: boolean
}

export interface UserActivityRepo {
  name_with_owner: string
  commits: number
  prs: number
}

export interface UserActivityOrg {
  login: string
  avatar_url: string | null
  commits: number
  prs: number
  repositories: UserActivityRepo[]
}

export interface UserActivityDiagnostics {
  github_total_commits: number
  github_total_prs: number
  restricted_contributions: number
}

export interface UserActivityResponse {
  username: string
  date_from: string
  date_to: string
  totals: { commits: number; prs: number }
  organizations: UserActivityOrg[]
  diagnostics: UserActivityDiagnostics
}

export interface CommitData {
  id: string
  hash: string
  short_hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  repository: string
  pr_number: number | null
  pr_url: string | null
}

export interface PullRequestData {
  id: string
  number: number
  title: string
  status: PullRequestStatus
  repository: string
  url: string
  created_at_remote: string
  merged_at: string | null
}

export interface ConnectionStats {
  connection_id: string
  commits_count: number
  prs_count: number
  total_additions: number
  total_deletions: number
}

export interface AggregatedStats {
  total_commits: number
  total_prs: number
  total_additions: number
  total_deletions: number
}

export interface SyncResult {
  connection_id: string
  status: "started" | "in_progress" | "completed"
  commits_synced: number
  prs_synced: number
  errors: string[]
}

export interface ValidateTokenRequest {
  provider: Provider
  pat: string
  username: string
}

export interface OrganizationInfo {
  slug: string
  name: string
  avatar_url: string | null
  description: string | null
}

export interface ValidateTokenResponse {
  valid: boolean
  organizations: OrganizationInfo[]
}

export interface ProductivityFilters {
  date_from?: string
  date_to?: string
  contract_id?: string
}

export interface LocalRepoActivity {
  display: string
  remote_url: string
  repo_name: string
  commits: number
  additions: number
  deletions: number
  last_commit: string | null
}
