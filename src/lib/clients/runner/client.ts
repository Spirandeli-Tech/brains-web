import { ApiClient } from '../api-client'
import type { RunnerOverview } from './types'

export class RunnerClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async getOverview(): Promise<RunnerOverview> {
    return this.client.get<RunnerOverview>('/runner/overview')
  }
}
