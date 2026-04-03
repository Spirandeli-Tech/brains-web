import type { BankAccountData } from '../bank-accounts/types'
import type { CustomerData } from '../customers/types'
import type { InvoiceServiceData, InvoiceServicePayload } from '../invoices/types'

export interface ContractData {
  id: string
  name: string
  customer: CustomerData
  bank_account: BankAccountData | null
  status: 'active' | 'inactive'
  annual_value: number
  currency: string
  invoice_day: number
  services: InvoiceServiceData[]
  notes: string | null
  contract_pdf_url: string | null
  created_at: string
  updated_at: string
}

export interface ContractListItem {
  id: string
  name: string
  customer: CustomerData
  status: 'active' | 'inactive'
  annual_value: number
  currency: string
  invoice_day: number
  created_at: string
}

export interface ContractCreatePayload {
  customer_id: string
  name: string
  status?: string
  annual_value: number
  currency?: string
  invoice_day: number
  bank_account_id?: string
  services: InvoiceServicePayload[]
  notes?: string
  contract_pdf_url?: string
}

export interface GenerateInvoicesResponse {
  generated: number
  skipped: number
  details: {
    generated: { contract_id: string; name: string; invoice_id: string }[]
    skipped: { contract_id: string; name: string; reason: string }[]
  }
}

export interface ContractUpdatePayload {
  customer_id?: string
  name?: string
  status?: string
  annual_value?: number
  currency?: string
  invoice_day?: number
  bank_account_id?: string
  services?: InvoiceServicePayload[]
  notes?: string
  contract_pdf_url?: string
}
