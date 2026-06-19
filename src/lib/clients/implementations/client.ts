import { ApiClient } from '../api-client'
import { mockApi } from './mock'
import type {
  ImplementationRun,
  ImplementationStats,
  LaunchRunPayload,
  Provider,
  RunStatus,
} from './types'

/**
 * Client for the Implementation Center.
 *
 * The backend module (api/app/api/implementations.py) is not built yet, so every
 * call gracefully falls back to an in-memory mock — the page is fully usable
 * today and will switch to real data automatically once the endpoints exist.
 */
export class ImplementationsClient {
  private client: ApiClient
  /** Flips to true the first time the real API answers, to stop using the mock. */
  private apiAvailable = false

  constructor() {
    this.client = new ApiClient()
  }

  private async withFallback<T>(real: () => Promise<T>, mock: () => T): Promise<T> {
    try {
      const result = await real()
      this.apiAvailable = true
      return result
    } catch {
      return mock()
    }
  }

  async listRuns(): Promise<ImplementationRun[]> {
    return this.withFallback(
      () => this.client.get<ImplementationRun[]>('/implementations/runs'),
      () => mockApi.listRuns(),
    )
  }

  async getRun(id: string): Promise<ImplementationRun> {
    return this.withFallback(
      () => this.client.get<ImplementationRun>(`/implementations/runs/${id}`),
      () => {
        const run = mockApi.getRun(id)
        if (!run) throw new Error('Run not found')
        return run
      },
    )
  }

  async launchRun(
    payload: LaunchRunPayload,
    /** Display metadata used only by the mock fallback. */
    meta?: { connection_name: string; provider: Provider },
  ): Promise<ImplementationRun> {
    return this.withFallback(
      () => this.client.post<ImplementationRun>('/implementations/runs', payload, true),
      () =>
        mockApi.launchRun(
          payload.connection_id,
          meta?.connection_name ?? 'Org',
          meta?.provider ?? 'github',
          payload.ticket_url,
          payload.steps,
          payload.instructions,
        ),
    )
  }

  async approveStep(runId: string, stepId: string): Promise<ImplementationRun> {
    return this.withFallback(
      () =>
        this.client.post<ImplementationRun>(
          `/implementations/runs/${runId}/steps/${stepId}/approve`,
          {},
          true,
        ),
      () => {
        const run = mockApi.approveStep(runId, stepId)
        if (!run) throw new Error('Run not found')
        return run
      },
    )
  }

  async cancelRun(runId: string): Promise<void> {
    return this.withFallback(
      () => this.client.delete<void>(`/implementations/runs/${runId}`),
      () => mockApi.cancelRun(runId),
    )
  }

  async discussStep(runId: string, stepId: string, message: string): Promise<ImplementationRun> {
    return this.withFallback(
      () =>
        this.client.post<ImplementationRun>(
          `/implementations/runs/${runId}/steps/${stepId}/discuss`,
          { message },
          true,
        ),
      () => {
        const run = mockApi.getRun(runId)
        if (!run) throw new Error('Run not found')
        return run
      },
    )
  }

  async restartRun(runId: string): Promise<ImplementationRun> {
    return this.withFallback(
      () => this.client.post<ImplementationRun>(`/implementations/runs/${runId}/restart`, {}, true),
      () => {
        const run = mockApi.getRun(runId)
        if (!run) throw new Error('Run not found')
        return run
      },
    )
  }

  /** Whether the real backend has answered at least once this session. */
  isApiAvailable(): boolean {
    return this.apiAvailable
  }
}

const ACTIVE_STATUSES: RunStatus[] = ['queued', 'running', 'awaiting_approval']

/** Derives the header stat cards from the current set of runs (client-side). */
export function computeStats(runs: ImplementationRun[]): ImplementationStats {
  return {
    active: runs.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    awaiting_approval: runs.filter((r) => r.status === 'awaiting_approval').length,
    completed: runs.filter((r) => r.status === 'done').length,
    failed: runs.filter((r) => r.status === 'failed').length,
  }
}
