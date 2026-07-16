import { ApiClient } from '../api-client'
import type { Insights } from './types'

export class InsightsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async getInsights(date?: string): Promise<Insights> {
    const path = date ? `/insights/${encodeURIComponent(date)}` : '/insights'
    return this.client.get<Insights>(path)
  }
}
