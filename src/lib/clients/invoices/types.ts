import type { BankAccountData } from '../bank-accounts/types'
import type { CustomerData } from '../customers/types'

export interface InvoiceServicePayload {
  service_title: string
  service_description?: string
  amount: number
  sort_order?: number
}

export interface InvoiceServiceData {
  id: string
  service_title: string
  service_description: string | null
  amount: number
  sort_order: number | null
  created_at: string
  updated_at: string
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly'

export interface InvoiceData {
  id: string
  invoice_number: string
  customer: CustomerData
  bank_account: BankAccountData | null
  issue_date: string
  due_date: string
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'void'
  total_amount: number
  services: InvoiceServiceData[]
  notes: string | null
  is_recurrent: boolean
  recurrence_frequency: RecurrenceFrequency | null
  recurrence_day: number | null
  created_at: string
  updated_at: string
}

export interface InvoiceListItem {
  id: string
  invoice_number: string
  customer: CustomerData
  issue_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'void'
  total_amount: number
  currency: string
  is_recurrent: boolean
  recurrence_frequency: RecurrenceFrequency | null
}

export interface InvoiceCreatePayload {
  customer_id: string
  invoice_number?: string
  issue_date: string
  due_date: string
  currency?: string
  status?: string
  bank_account_id?: string
  services: InvoiceServicePayload[]
  notes?: string
  is_recurrent?: boolean
  recurrence_frequency?: RecurrenceFrequency
  recurrence_day?: number
}

export interface InvoiceUpdatePayload {
  customer_id?: string
  invoice_number?: string
  issue_date?: string
  due_date?: string
  currency?: string
  status?: string
  bank_account_id?: string
  services?: InvoiceServicePayload[]
  notes?: string
  is_recurrent?: boolean
  recurrence_frequency?: RecurrenceFrequency
  recurrence_day?: number
}

export interface InvoiceFilters {
  status?: string
  customer_id?: string
  issue_date_from?: string
  issue_date_to?: string
}

export interface IInvoicesClient {
  listInvoices(filters?: InvoiceFilters): Promise<InvoiceListItem[]>
  getInvoice(id: string): Promise<InvoiceData>
  createInvoice(data: InvoiceCreatePayload): Promise<InvoiceData>
  updateInvoice(id: string, data: InvoiceUpdatePayload): Promise<InvoiceData>
  deleteInvoice(id: string): Promise<void>
}
