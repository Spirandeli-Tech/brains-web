export interface BankAccountData {
  id: string
  label: string
  beneficiary_full_name: string
  beneficiary_full_address: string | null
  beneficiary_account_number: string
  swift_code: string
  bank_name: string | null
  bank_address: string | null
  intermediary_bank_info: string | null
  created_at: string
  updated_at: string
}

export interface BankAccountCreatePayload {
  label: string
  beneficiary_full_name: string
  beneficiary_full_address?: string
  beneficiary_account_number: string
  swift_code: string
  bank_name?: string
  bank_address?: string
  intermediary_bank_info?: string
}

export interface BankAccountUpdatePayload {
  label?: string
  beneficiary_full_name?: string
  beneficiary_full_address?: string
  beneficiary_account_number?: string
  swift_code?: string
  bank_name?: string
  bank_address?: string
  intermediary_bank_info?: string
}

export interface IBankAccountsClient {
  listBankAccounts(): Promise<BankAccountData[]>
  getBankAccount(id: string): Promise<BankAccountData>
  createBankAccount(data: BankAccountCreatePayload): Promise<BankAccountData>
  updateBankAccount(id: string, data: BankAccountUpdatePayload): Promise<BankAccountData>
  deleteBankAccount(id: string): Promise<void>
}
