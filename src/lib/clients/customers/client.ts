import { ApiClient } from '../api-client'
import type { CustomerCreatePayload, CustomerData, CustomerUpdatePayload, ICustomersClient } from './types'

export class CustomersClient implements ICustomersClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listCustomers(q?: string): Promise<CustomerData[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    return this.client.get<CustomerData[]>(`/customers${query}`)
  }

  async getCustomer(id: string): Promise<CustomerData> {
    return this.client.get<CustomerData>(`/customers/${id}`)
  }

  async createCustomer(data: CustomerCreatePayload): Promise<CustomerData> {
    return this.client.post<CustomerData>('/customers', data, true)
  }

  async updateCustomer(id: string, data: CustomerUpdatePayload): Promise<CustomerData> {
    return this.client.put<CustomerData>(`/customers/${id}`, data)
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.client.delete<void>(`/customers/${id}`)
  }
}
