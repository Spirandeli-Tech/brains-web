export interface ServiceData {
  id: string
  service_title: string
  service_description: string | null
  amount: number
  sort_order: number | null
  created_at: string
  updated_at: string
}

export interface ServiceCreatePayload {
  service_title: string
  service_description?: string
  amount: number
}

export interface ServiceUpdatePayload {
  service_title?: string
  service_description?: string
  amount?: number
}

export interface IServicesClient {
  listServices(q?: string): Promise<ServiceData[]>
  getService(id: string): Promise<ServiceData>
  createService(data: ServiceCreatePayload): Promise<ServiceData>
  updateService(id: string, data: ServiceUpdatePayload): Promise<ServiceData>
  deleteService(id: string): Promise<void>
}
