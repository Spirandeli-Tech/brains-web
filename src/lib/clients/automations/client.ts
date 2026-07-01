import { ApiClient } from '../api-client'
import type { Automation, AutomationRun, CreateAutomationPayload, UpdateAutomationPayload } from './types'

export class AutomationsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listAutomations(): Promise<Automation[]> {
    return this.client.get<Automation[]>('/automations')
  }

  async getAutomation(id: string): Promise<Automation> {
    return this.client.get<Automation>(`/automations/${id}`)
  }

  async listSkills(): Promise<string[]> {
    return this.client.get<string[]>('/automations/skills')
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

  async runAutomationNow(id: string): Promise<AutomationRun> {
    return this.client.post<AutomationRun>(`/automations/${id}/run`, {}, true)
  }
}
