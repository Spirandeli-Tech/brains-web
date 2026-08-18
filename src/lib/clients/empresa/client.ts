import { ApiClient } from '../api-client'
import type { AgentData, MessageData, RitualData, SendMessagePayload, TaskData } from './types'

export class EmpresaClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listAgents(): Promise<AgentData[]> {
    return this.client.get<AgentData[]>('/empresa/agents')
  }

  async listFeed(limit = 50): Promise<MessageData[]> {
    return this.client.get<MessageData[]>(`/empresa/feed?limit=${limit}`)
  }

  /** O back força o destinatário: toda mensagem do investidor vai pro CEO (salomao). */
  async sendMessage(payload: SendMessagePayload): Promise<MessageData> {
    return this.client.post<MessageData>('/empresa/messages', payload, true)
  }

  async listTasks(limit = 100): Promise<TaskData[]> {
    return this.client.get<TaskData[]>(`/empresa/tasks?limit=${limit}`)
  }

  async listRituais(): Promise<RitualData[]> {
    return this.client.get<RitualData[]>('/empresa/rituais')
  }
}
