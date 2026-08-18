import { ApiClient } from '../api-client'
import type {
  AgentData,
  DiagnosticoData,
  EstadoData,
  MessageData,
  RitualData,
  SendMessagePayload,
  SkillDoc,
  TaskData,
  TaskDetailData,
} from './types'

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

  /** Dispara um ritual imediatamente (vira agent_task na fila) e retorna a task criada. */
  async executarRitual(name: string): Promise<TaskData> {
    return this.client.post<TaskData>(
      `/empresa/rituais/${encodeURIComponent(name)}/executar`,
      null,
      true,
    )
  }

  /** O SKILL.md (markdown) de uma skill da empresa. */
  async getSkillDoc(skill: string): Promise<SkillDoc> {
    return this.client.get<SkillDoc>(`/empresa/skills/${encodeURIComponent(skill)}`)
  }

  /** Detalhe de uma task, incluindo o transcript (log) da execução. */
  async getTask(id: string): Promise<TaskDetailData> {
    return this.client.get<TaskDetailData>(`/empresa/tasks/${encodeURIComponent(id)}`)
  }

  /** Estado geral da empresa (desligada/ligada pelo investidor). */
  async getEstado(): Promise<EstadoData> {
    return this.client.get<EstadoData>('/empresa/estado')
  }

  /** Liga/desliga a empresa: nada novo inicia enquanto pausada. */
  async setEstado(pausada: boolean): Promise<EstadoData> {
    return this.client.post<EstadoData>('/empresa/estado', { pausada }, true)
  }

  /** Diagnóstico da corrente: por que a empresa está (ou não) parada. */
  async getDiagnostico(): Promise<DiagnosticoData> {
    return this.client.get<DiagnosticoData>('/empresa/diagnostico')
  }
}
