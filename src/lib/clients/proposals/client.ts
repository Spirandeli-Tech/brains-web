import { ApiClient } from '../api-client'
import type { Proposal } from './types'

export class ProposalsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async list(status?: string): Promise<Proposal[]> {
    const query = status ? `?status_filter=${encodeURIComponent(status)}` : ''
    return this.client.get<Proposal[]>(`/proposals${query}`)
  }

  async accept(id: string): Promise<Proposal> {
    return this.client.post<Proposal>(`/proposals/${id}/accept`, {}, true)
  }

  async dismiss(id: string): Promise<Proposal> {
    return this.client.post<Proposal>(`/proposals/${id}/dismiss`, {}, true)
  }
}
