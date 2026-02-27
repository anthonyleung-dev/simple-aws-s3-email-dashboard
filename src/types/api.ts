// Generic API response wrapper for consistent response shape
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: ApiErrorResponse
    timestamp: string
}

// Paginated response with cursor-based pagination for S3 list operations
export interface PaginatedResponse<T> {
    items: T[]
    nextCursor?: string // base64-encoded ContinuationToken
    hasMore: boolean
    totalFetched: number
}

// Structured API error with tracing context
export interface ApiErrorResponse {
    code: string
    message: string
    functionName?: string
    details?: Record<string, unknown>
}
