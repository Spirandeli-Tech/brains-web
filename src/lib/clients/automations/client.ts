import { ApiClient } from '../api-client'
import type { Automation, CreateAutomationPayload, UpdateAutomationPayload } from './types'

export class AutomationsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listAutomations(): Promise<Automation[]> {
    return this.client.get<Automation[]>('/automations')
  }

  async createAutomation(payload: CreateAutomationPayload): Promise<Automation> {
    return this.client.post<Automation>('/automations', payload, true)
  }

  async updateAutomation(id: string, payload: UpdateAutomationPayload): Promise<Automation> {
    return this.client.patch<Automation>(`/automations/${id}`, payload)
  }

  async deleteAutomation(id: string): Promise<void> {
    return this.client.delete<void>(`/automations/${id}`)
  }
}
