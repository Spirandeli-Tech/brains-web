import { SearchClient } from './client'

export { SearchClient }
export { SearchResultType } from './types'
export type { SearchResponse, SearchResultGroup, SearchResultItem } from './types'

export const searchClient = new SearchClient()
