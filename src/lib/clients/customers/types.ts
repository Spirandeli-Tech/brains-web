export interface CustomerData {
  id: string
  legal_name: string
  display_name: string | null
  tax_id: string | null
  email: string | null
  phone: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  created_at: string
  updated_at: string
}

export interface CustomerCreatePayload {
  legal_name: string
  display_name?: string
  tax_id?: string
  email?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface CustomerUpdatePayload {
  legal_name?: string
  display_name?: string
  tax_id?: string
  email?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface ICustomersClient {
  listCustomers(q?: string): Promise<CustomerData[]>
  getCustomer(id: string): Promise<CustomerData>
  createCustomer(data: CustomerCreatePayload): Promise<CustomerData>
  updateCustomer(id: string, data: CustomerUpdatePayload): Promise<CustomerData>
  deleteCustomer(id: string): Promise<void>
}
