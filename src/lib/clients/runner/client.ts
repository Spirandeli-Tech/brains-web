import { ApiClient } from '../api-client'
import type { RestartResult, RunKind, RunnerOverview } from './types'

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

  /**
   * Ask a runner to bounce itself. The request rides on the runner's next
   * heartbeat (a few seconds), which is why it works even when the runner is
   * wedged inside a job.
   */
  async restartRunner(runnerId: string): Promise<RestartResult> {
    return this.client.post<RestartResult>(
      `/runner/${encodeURIComponent(runnerId)}/restart`,
      {},
      true
    )
  }
}
