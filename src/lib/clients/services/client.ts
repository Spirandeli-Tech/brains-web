import { ApiClient } from '../api-client'
import type { ServiceCreatePayload, ServiceData, ServiceUpdatePayload, IServicesClient } from './types'

export class ServicesClient implements IServicesClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listServices(q?: string): Promise<ServiceData[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    return this.client.get<ServiceData[]>(`/services${query}`)
  }

  async getService(id: string): Promise<ServiceData> {
    return this.client.get<ServiceData>(`/services/${id}`)
  }

  async createService(data: ServiceCreatePayload): Promise<ServiceData> {
    return this.client.post<ServiceData>('/services', data, true)
  }

  async updateService(id: string, data: ServiceUpdatePayload): Promise<ServiceData> {
    return this.client.put<ServiceData>(`/services/${id}`, data)
  }

  async deleteService(id: string): Promise<void> {
    return this.client.delete<void>(`/services/${id}`)
  }
}
