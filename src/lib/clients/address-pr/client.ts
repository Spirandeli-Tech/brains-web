import { ApiClient } from '../api-client'
import type {
  AddressPrStats,
  FixRun,
  LaunchAddressPrPayload,
  RunStatus,
} from './types'

export class AddressPrClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listRuns(): Promise<FixRun[]> {
    return this.client.get<FixRun[]>('/address-pr/runs')
  }

  async getRun(id: string): Promise<FixRun> {
    return this.client.get<FixRun>(`/address-pr/runs/${id}`)
  }

  async launchRun(payload: LaunchAddressPrPayload): Promise<FixRun> {
    return this.client.post<FixRun>('/address-pr/runs', payload, true)
  }

  async approveStep(
    runId: string,
    stepId: string,
    fixPlan: object | null,
  ): Promise<FixRun> {
    return this.client.post<FixRun>(
      `/address-pr/runs/${runId}/steps/${stepId}/approve`,
      { fix_plan: fixPlan },
      true,
    )
  }

  async iterateStep(runId: string, stepId: string, notes: string): Promise<FixRun> {
    return this.client.post<FixRun>(
      `/address-pr/runs/${runId}/steps/${stepId}/iterate`,
      { notes },
      true,
    )
  }

  async cancelRun(runId: string): Promise<void> {
    return this.client.delete<void>(`/address-pr/runs/${runId}`)
  }

  async restartRun(runId: string): Promise<FixRun> {
    return this.client.post<FixRun>(`/address-pr/runs/${runId}/restart`, {}, true)
  }

  /** Repos are registered by the same runner — reuse the implementations endpoint. */
  async getConnectionRepos(connectionName: string): Promise<{ name: string; base_branch: string }[]> {
    return this.client.get(`/implementations/connections/${encodeURIComponent(connectionName)}/repos`)
  }
}

const ACTIVE_STATUSES: RunStatus[] = ['queued', 'running', 'awaiting_approval']

export function computeStats(runs: FixRun[]): AddressPrStats {
  return {
    active: runs.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    awaiting_approval: runs.filter((r) => r.status === 'awaiting_approval').length,
    completed: runs.filter((r) => r.status === 'done').length,
    failed: runs.filter((r) => r.status === 'failed').length,
  }
}
