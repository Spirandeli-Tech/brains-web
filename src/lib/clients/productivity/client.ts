import { ApiClient } from '../api-client'
import type {
  AggregatedStats,
  CommitData,
  ConnectionCreatePayload,
  ConnectionData,
  ConnectionListItem,
  ConnectionStats,
  ConnectionUpdatePayload,
  ListReposRequest,
  LocalRepoActivity,
  ProductivityFilters,
  PullRequestData,
  SyncResult,
  UserActivityResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from './types'

export class ProductivityClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  private buildFilterParams(filters?: ProductivityFilters): string {
    if (!filters) return ''
    const params = new URLSearchParams()
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    if (filters.contract_id) params.set('contract_id', filters.contract_id)
    const str = params.toString()
    return str ? `?${str}` : ''
  }

  async validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    return this.client.post<ValidateTokenResponse>('/productivity/validate-token', data, true)
  }

  async listRepos(data: ListReposRequest): Promise<string[]> {
    const params = data.workspace ? `?workspace=${encodeURIComponent(data.workspace)}` : ''
    return this.client.post<string[]>(`/productivity/list-repos${params}`, data, true)
  }

  async listConnectionRepos(connectionId: string): Promise<string[]> {
    return this.client.get<string[]>(`/productivity/connections/${connectionId}/repos`)
  }

  async listConnections(): Promise<ConnectionListItem[]> {
    return this.client.get<ConnectionListItem[]>('/productivity/connections')
  }

  async getConnection(id: string): Promise<ConnectionData> {
    return this.client.get<ConnectionData>(`/productivity/connections/${id}`)
  }

  async createConnection(data: ConnectionCreatePayload): Promise<ConnectionData> {
    return this.client.post<ConnectionData>('/productivity/connections', data, true)
  }

  async updateConnection(id: string, data: ConnectionUpdatePayload): Promise<ConnectionData> {
    return this.client.put<ConnectionData>(`/productivity/connections/${id}`, data)
  }

  async deleteConnection(id: string): Promise<void> {
    return this.client.delete<void>(`/productivity/connections/${id}`)
  }

  async syncConnection(id: string): Promise<SyncResult> {
    return this.client.post<SyncResult>(`/productivity/connections/${id}/sync`, {}, true)
  }

  async getCommits(connectionId: string, filters?: ProductivityFilters): Promise<CommitData[]> {
    return this.client.get<CommitData[]>(
      `/productivity/connections/${connectionId}/commits${this.buildFilterParams(filters)}`
    )
  }

  async getPullRequests(connectionId: string, filters?: ProductivityFilters): Promise<PullRequestData[]> {
    return this.client.get<PullRequestData[]>(
      `/productivity/connections/${connectionId}/pull-requests${this.buildFilterParams(filters)}`
    )
  }

  async getConnectionStats(connectionId: string, filters?: ProductivityFilters): Promise<ConnectionStats> {
    return this.client.get<ConnectionStats>(
      `/productivity/connections/${connectionId}/stats${this.buildFilterParams(filters)}`
    )
  }

  async getAggregatedStats(filters?: ProductivityFilters): Promise<AggregatedStats> {
    return this.client.get<AggregatedStats>(
      `/productivity/stats${this.buildFilterParams(filters)}`
    )
  }

  async getUserActivity(dateFrom: string, dateTo: string): Promise<UserActivityResponse> {
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
    return this.client.get<UserActivityResponse>(`/productivity/user-activity?${params.toString()}`)
  }

  async getLocalCommitsByRepo(dateFrom: string, dateTo: string): Promise<LocalRepoActivity[]> {
    const params = new URLSearchParams({ from: dateFrom, to: dateTo })
    return this.client.get<LocalRepoActivity[]>(`/productivity/local-commits/by-repo?${params.toString()}`)
  }
}
