export interface TransactionCategoryData {
  id: string
  name: string
  color: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface TransactionCategoryCreatePayload {
  name: string
  color?: string
  icon?: string
}

export interface TransactionCategoryUpdatePayload {
  name?: string
  color?: string
  icon?: string
}

export interface ITransactionCategoriesClient {
  listCategories(q?: string): Promise<TransactionCategoryData[]>
  getCategory(id: string): Promise<TransactionCategoryData>
  createCategory(data: TransactionCategoryCreatePayload): Promise<TransactionCategoryData>
  updateCategory(id: string, data: TransactionCategoryUpdatePayload): Promise<TransactionCategoryData>
  deleteCategory(id: string): Promise<void>
}
