import { ApiClient } from '../api-client'
import type {
  BankAccountCreatePayload,
  BankAccountData,
  BankAccountUpdatePayload,
  IBankAccountsClient,
} from './types'

export class BankAccountsClient implements IBankAccountsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listBankAccounts(): Promise<BankAccountData[]> {
    return this.client.get<BankAccountData[]>('/bank-accounts')
  }

  async getBankAccount(id: string): Promise<BankAccountData> {
    return this.client.get<BankAccountData>(`/bank-accounts/${id}`)
  }

  async createBankAccount(data: BankAccountCreatePayload): Promise<BankAccountData> {
    return this.client.post<BankAccountData>('/bank-accounts', data, true)
  }

  async updateBankAccount(id: string, data: BankAccountUpdatePayload): Promise<BankAccountData> {
    return this.client.put<BankAccountData>(`/bank-accounts/${id}`, data)
  }

  async deleteBankAccount(id: string): Promise<void> {
    return this.client.delete<void>(`/bank-accounts/${id}`)
  }
}
