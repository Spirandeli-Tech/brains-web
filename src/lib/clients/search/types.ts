export interface SearchResultItem {
  id: string
  title: string
  subtitle?: string
}

export enum SearchResultType {
  INVOICES = 'invoices',
  CUSTOMERS = 'customers',
  BANKS = 'banks',
  SERVICES = 'services',
  USERS = 'users',
}

export interface SearchResultGroup {
  type: SearchResultType
  items: SearchResultItem[]
}

export interface SearchResponse {
  status: string
  data: SearchResultGroup[]
}

export interface ISearchClient {
  search(q: string): Promise<SearchResponse>
}
