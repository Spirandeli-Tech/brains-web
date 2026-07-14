import { ApiClient } from '../api-client'
import type { Briefing } from './types'

export class BriefingClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async getBriefing(date?: string): Promise<Briefing> {
    const query = date ? `?date=${encodeURIComponent(date)}` : ''
    return this.client.get<Briefing>(`/briefing${query}`)
  }

  async markSeen(): Promise<void> {
    return this.client.post<void>('/briefing/seen', {}, true)
  }
}
