import type { CustomerData } from '../customers/types'

export interface InvoiceData {
  id: string
  invoice_number: string
  customer: CustomerData
  issue_date: string
  due_date: string
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'void'
  service_title: string
  service_description: string
  amount_total: number
  notes: string | null
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
  amount_total: number
  currency: string
}

export interface InvoiceCreatePayload {
  customer_id: string
  invoice_number?: string
  issue_date: string
  due_date: string
  currency?: string
  status?: string
  service_title: string
  service_description: string
  amount_total: number
  notes?: string
}

export interface InvoiceUpdatePayload {
  customer_id?: string
  invoice_number?: string
  issue_date?: string
  due_date?: string
  currency?: string
  status?: string
  service_title?: string
  service_description?: string
  amount_total?: number
  notes?: string
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
