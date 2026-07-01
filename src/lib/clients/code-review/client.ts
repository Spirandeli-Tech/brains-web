import { ApiClient } from '../api-client'
import type {
  LaunchReviewPayload,
  ReviewRun,
  ReviewStats,
  RunStatus,
} from './types'

export class CodeReviewClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listRuns(): Promise<ReviewRun[]> {
    return this.client.get<ReviewRun[]>('/code-reviews/runs')
  }

  async getRun(id: string): Promise<ReviewRun> {
    return this.client.get<ReviewRun>(`/code-reviews/runs/${id}`)
  }

  async launchRun(payload: LaunchReviewPayload): Promise<ReviewRun> {
    return this.client.post<ReviewRun>('/code-reviews/runs', payload, true)
  }

  async approveStep(
    runId: string,
    stepId: string,
    opts: { review_action?: string; review_plan?: object | null },
  ): Promise<ReviewRun> {
    return this.client.post<ReviewRun>(
      `/code-reviews/runs/${runId}/steps/${stepId}/approve`,
      opts,
      true,
    )
  }

  async iterateStep(runId: string, stepId: string, notes: string): Promise<ReviewRun> {
    return this.client.post<ReviewRun>(
      `/code-reviews/runs/${runId}/steps/${stepId}/iterate`,
      { notes },
      true,
    )
  }

  async cancelRun(runId: string): Promise<void> {
    return this.client.delete<void>(`/code-reviews/runs/${runId}`)
  }

  async restartRun(runId: string): Promise<ReviewRun> {
    return this.client.post<ReviewRun>(`/code-reviews/runs/${runId}/restart`, {}, true)
  }

  /** Repos are registered by the same runner — reuse the implementations endpoint. */
  async getConnectionRepos(connectionName: string): Promise<{ name: string; base_branch: string }[]> {
    return this.client.get(`/implementations/connections/${encodeURIComponent(connectionName)}/repos`)
  }
}

const ACTIVE_STATUSES: RunStatus[] = ['queued', 'running', 'awaiting_approval']

export function computeStats(runs: ReviewRun[]): ReviewStats {
  return {
    active: runs.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    awaiting_approval: runs.filter((r) => r.status === 'awaiting_approval').length,
    completed: runs.filter((r) => r.status === 'done').length,
    failed: runs.filter((r) => r.status === 'failed').length,
  }
}
