import { ApiClient } from '../api-client'
import type { CreateWatcherPayload, UpdateWatcherPayload, Watcher } from './types'

export class WatchersClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listWatchers(): Promise<Watcher[]> {
    return this.client.get<Watcher[]>('/watchers')
  }

  async createWatcher(payload: CreateWatcherPayload): Promise<Watcher> {
    return this.client.post<Watcher>('/watchers', payload, true)
  }

  async updateWatcher(id: string, payload: UpdateWatcherPayload): Promise<Watcher> {
    return this.client.patch<Watcher>(`/watchers/${id}`, payload)
  }

  async deleteWatcher(id: string): Promise<void> {
    return this.client.delete<void>(`/watchers/${id}`)
  }

  async runNow(id: string): Promise<Watcher> {
    return this.client.post<Watcher>(`/watchers/${id}/run-now`, {}, true)
  }
}
