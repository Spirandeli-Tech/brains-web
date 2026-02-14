import { ApiClient } from '../api-client'
import type {
  TransactionCategoryCreatePayload,
  TransactionCategoryData,
  TransactionCategoryUpdatePayload,
  ITransactionCategoriesClient,
} from './types'

export class TransactionCategoriesClient implements ITransactionCategoriesClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listCategories(q?: string): Promise<TransactionCategoryData[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : ''
    return this.client.get<TransactionCategoryData[]>(`/transaction-categories${query}`)
  }

  async getCategory(id: string): Promise<TransactionCategoryData> {
    return this.client.get<TransactionCategoryData>(`/transaction-categories/${id}`)
  }

  async createCategory(data: TransactionCategoryCreatePayload): Promise<TransactionCategoryData> {
    return this.client.post<TransactionCategoryData>('/transaction-categories', data, true)
  }

  async updateCategory(id: string, data: TransactionCategoryUpdatePayload): Promise<TransactionCategoryData> {
    return this.client.put<TransactionCategoryData>(`/transaction-categories/${id}`, data)
  }

  async deleteCategory(id: string): Promise<void> {
    return this.client.delete<void>(`/transaction-categories/${id}`)
  }
}
