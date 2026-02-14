import { ApiClient } from '../api-client'
import type {
  BankAccountBalance,
  TransactionContext,
  TransactionCreatePayload,
  TransactionData,
  TransactionFilters,
  TransactionListItem,
  TransactionSummary,
  TransactionUpdatePayload,
  ITransactionsClient,
} from './types'

export class TransactionsClient implements ITransactionsClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  private buildFilterParams(filters?: TransactionFilters): string {
    const params = new URLSearchParams()
    if (filters?.type) params.set('type', filters.type)
    if (filters?.context) params.set('context', filters.context)
    if (filters?.category_id) params.set('category_id', filters.category_id)
    if (filters?.bank_account_id) params.set('bank_account_id', filters.bank_account_id)
    if (filters?.date_from) params.set('date_from', filters.date_from)
    if (filters?.date_to) params.set('date_to', filters.date_to)
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  async listTransactions(filters?: TransactionFilters): Promise<TransactionListItem[]> {
    return this.client.get<TransactionListItem[]>(`/transactions${this.buildFilterParams(filters)}`)
  }

  async getTransaction(id: string): Promise<TransactionData> {
    return this.client.get<TransactionData>(`/transactions/${id}`)
  }

  async createTransaction(data: TransactionCreatePayload): Promise<TransactionData> {
    return this.client.post<TransactionData>('/transactions', data, true)
  }

  async updateTransaction(id: string, data: TransactionUpdatePayload): Promise<TransactionData> {
    return this.client.put<TransactionData>(`/transactions/${id}`, data)
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.client.delete<void>(`/transactions/${id}`)
  }

  async getSummary(filters?: TransactionFilters): Promise<TransactionSummary> {
    return this.client.get<TransactionSummary>(`/transactions/summary${this.buildFilterParams(filters)}`)
  }

  async getBankBalances(context?: TransactionContext): Promise<BankAccountBalance[]> {
    const query = context ? `?context=${context}` : ''
    return this.client.get<BankAccountBalance[]>(`/transactions/bank-balances${query}`)
  }
}
