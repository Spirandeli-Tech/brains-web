import type { BankAccountData } from '../bank-accounts/types'
import type { TransactionCategoryData } from '../transaction-categories/types'

export type TransactionType = 'expense' | 'income'
export type TransactionContext = 'business' | 'personal'

export interface TransactionData {
  id: string
  type: TransactionType
  context: TransactionContext
  description: string
  amount: number
  currency: string
  date: string
  category: TransactionCategoryData | null
  bank_account: BankAccountData | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TransactionListItem {
  id: string
  type: TransactionType
  context: TransactionContext
  description: string
  amount: number
  currency: string
  date: string
  category: TransactionCategoryData | null
  bank_account: BankAccountData | null
  created_at: string
}

export interface TransactionCreatePayload {
  type: TransactionType
  context?: TransactionContext
  description: string
  amount: number
  currency?: string
  date: string
  category_id?: string
  bank_account_id?: string
  notes?: string
}

export interface TransactionUpdatePayload {
  type?: TransactionType
  context?: TransactionContext
  description?: string
  amount?: number
  currency?: string
  date?: string
  category_id?: string
  bank_account_id?: string
  notes?: string
}

export interface TransactionFilters {
  type?: TransactionType
  context?: TransactionContext
  category_id?: string
  bank_account_id?: string
  date_from?: string
  date_to?: string
}

export interface TransactionSummary {
  total_income: number
  total_expenses: number
  net_balance: number
  transaction_count: number
}

export interface BankAccountBalance {
  bank_account_id: string
  bank_account_label: string
  total_income: number
  total_expenses: number
  balance: number
}

export interface ITransactionsClient {
  listTransactions(filters?: TransactionFilters): Promise<TransactionListItem[]>
  getTransaction(id: string): Promise<TransactionData>
  createTransaction(data: TransactionCreatePayload): Promise<TransactionData>
  updateTransaction(id: string, data: TransactionUpdatePayload): Promise<TransactionData>
  deleteTransaction(id: string): Promise<void>
  getSummary(filters?: TransactionFilters): Promise<TransactionSummary>
  getBankBalances(context?: TransactionContext): Promise<BankAccountBalance[]>
}
