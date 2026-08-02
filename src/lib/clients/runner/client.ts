import { ApiClient } from '../api-client'
import type { RunKind, RunnerOverview } from './types'

export class RunnerClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async getOverview(): Promise<RunnerOverview> {
    return this.client.get<RunnerOverview>('/runner/overview')
  }

  /** Drop a job the runner hasn't claimed yet off the queue. */
  async cancelQueuedRun(kind: RunKind, runId: string): Promise<void> {
    await this.client.post<void>(`/runner/queue/${kind}/${runId}/cancel`, {}, true)
  }
}
