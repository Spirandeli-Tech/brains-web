import { ApiClient } from '../api-client'
import type { Devocional, DevocionalDetail } from './types'

export class DevocionaisClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async list(): Promise<Devocional[]> {
    return this.client.get<Devocional[]>('/devocionais')
  }

  async get(slug: string): Promise<DevocionalDetail> {
    return this.client.get<DevocionalDetail>(`/devocionais/${slug}`)
  }
}
