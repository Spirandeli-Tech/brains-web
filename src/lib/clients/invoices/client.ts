import { ApiClient } from '../api-client'
import type {
  InvoiceCreatePayload,
  InvoiceData,
  InvoiceFilters,
  InvoiceListItem,
  InvoiceUpdatePayload,
  IInvoicesClient,
} from './types'

export class InvoicesClient implements IInvoicesClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listInvoices(filters?: InvoiceFilters): Promise<InvoiceListItem[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customer_id) params.set('customer_id', filters.customer_id)
    if (filters?.issue_date_from) params.set('issue_date_from', filters.issue_date_from)
    if (filters?.issue_date_to) params.set('issue_date_to', filters.issue_date_to)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.client.get<InvoiceListItem[]>(`/invoices${query}`)
  }

  async getInvoice(id: string): Promise<InvoiceData> {
    return this.client.get<InvoiceData>(`/invoices/${id}`)
  }

  async createInvoice(data: InvoiceCreatePayload): Promise<InvoiceData> {
    return this.client.post<InvoiceData>('/invoices', data, true)
  }

  async updateInvoice(id: string, data: InvoiceUpdatePayload): Promise<InvoiceData> {
    return this.client.put<InvoiceData>(`/invoices/${id}`, data)
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.client.delete<void>(`/invoices/${id}`)
  }
}
