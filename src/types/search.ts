// Searchable fields for email filtering
export type SearchField = 'subject' | 'from' | 'to' | 'body' | 'all'

// Search query structure sent from client to API
export interface SearchQuery {
    query: string
    fields: SearchField[]
    pageSize?: number
    cursor?: string
}

// Search result with match metadata for display
export interface SearchResult<T> {
    items: T[]
    query: string
    fields: SearchField[]
    totalMatched: number
    hasMore: boolean
    nextCursor?: string
}
