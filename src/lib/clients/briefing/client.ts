import { ApiClient } from '../api-client'
import type { Briefing, BriefingEvent } from './types'

export class BriefingClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async getBriefing(date?: string): Promise<Briefing> {
    const query = date ? `?date=${encodeURIComponent(date)}` : ''
    return this.client.get<Briefing>(`/briefing${query}`)
  }

  async getRecentEvents(limit = 50): Promise<BriefingEvent[]> {
    return this.client.get<BriefingEvent[]>(`/briefing/events?limit=${limit}`)
  }

  async markSeen(): Promise<void> {
    return this.client.post<void>('/briefing/seen', {}, true)
  }
}
