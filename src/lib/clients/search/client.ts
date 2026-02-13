import { ApiClient } from '../api-client'
import type { SearchResponse, ISearchClient } from './types'

export class SearchClient implements ISearchClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async search(q: string): Promise<SearchResponse> {
    return this.client.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`)
  }
}
