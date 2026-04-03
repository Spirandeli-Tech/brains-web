import { ApiClient } from '../api-client'
import type { ContractCreatePayload, ContractData, ContractListItem, ContractUpdatePayload, GenerateInvoicesResponse } from './types'

export class ContractsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listContracts(): Promise<ContractListItem[]> {
    return this.client.get<ContractListItem[]>('/contracts')
  }

  async getContract(id: string): Promise<ContractData> {
    return this.client.get<ContractData>(`/contracts/${id}`)
  }

  async createContract(data: ContractCreatePayload): Promise<ContractData> {
    return this.client.post<ContractData>('/contracts', data, true)
  }

  async updateContract(id: string, data: ContractUpdatePayload): Promise<ContractData> {
    return this.client.put<ContractData>(`/contracts/${id}`, data)
  }

  async deleteContract(id: string): Promise<void> {
    return this.client.delete<void>(`/contracts/${id}`)
  }

  async generateInvoices(year: number, month: number): Promise<GenerateInvoicesResponse> {
    return this.client.post<GenerateInvoicesResponse>(`/contracts/generate-invoices?year=${year}&month=${month}`, {}, true)
  }
}
