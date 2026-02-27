// Client-side service layer for email API operations.
// Wraps fetch calls with structured error handling and typed responses.

import { ApiResponse, PaginatedResponse } from '@/types/api'
import { EmailSummary, EmailDetail } from '@/types/email'
import { SearchField, SearchResult } from '@/types/search'

// Fetch a paginated list of email summaries
export async function fetchEmails(params?: {
    pageSize?: number
    cursor?: string
}): Promise<ApiResponse<PaginatedResponse<EmailSummary>>> {
    const functionName = 'fetchEmails'

    try {
        const searchParams = new URLSearchParams()

        if (params?.pageSize) {
            searchParams.set('pageSize', String(params.pageSize))
        }
        if (params?.cursor) {
            searchParams.set('cursor', params.cursor)
        }

        const queryString = searchParams.toString()
        const url = `/api/emails${queryString ? `?${queryString}` : ''}`

        const response = await fetch(url)
        const data: ApiResponse<PaginatedResponse<EmailSummary>> = await response.json()

        return data
    } catch (error) {
        console.error(`[${functionName}] Failed to fetch emails`, error)

        return {
            success: false,
            error: {
                code: 'FETCH_EMAILS_FAILED',
                message: error instanceof Error ? error.message : 'Failed to fetch emails',
                functionName,
            },
            timestamp: new Date().toISOString(),
        }
    }
}

// Fetch full detail for a single email by its base64url-encoded ID
export async function fetchEmailDetail(id: string): Promise<ApiResponse<EmailDetail>> {
    const functionName = 'fetchEmailDetail'

    try {
        const response = await fetch(`/api/emails/${encodeURIComponent(id)}`)
        const data: ApiResponse<EmailDetail> = await response.json()

        return data
    } catch (error) {
        console.error(`[${functionName}] Failed to fetch email detail`, { id, error })

        return {
            success: false,
            error: {
                code: 'FETCH_EMAIL_DETAIL_FAILED',
                message: error instanceof Error ? error.message : 'Failed to fetch email detail',
                functionName,
                details: { id },
            },
            timestamp: new Date().toISOString(),
        }
    }
}

// Delete an email by its base64url-encoded ID
export async function deleteEmail(id: string): Promise<ApiResponse<{ deletedId: string }>> {
    const functionName = 'deleteEmail'

    try {
        const response = await fetch(`/api/emails/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        })
        const data: ApiResponse<{ deletedId: string }> = await response.json()

        return data
    } catch (error) {
        console.error(`[${functionName}] Failed to delete email`, { id, error })

        return {
            success: false,
            error: {
                code: 'DELETE_EMAIL_FAILED',
                message: error instanceof Error ? error.message : 'Failed to delete email',
                functionName,
                details: { id },
            },
            timestamp: new Date().toISOString(),
        }
    }
}

// Download a single attachment by triggering a browser file save dialog
export async function downloadAttachment(
    emailId: string,
    attachmentIndex: number,
    filename: string,
): Promise<{ success: boolean; error?: string }> {
    const functionName = 'downloadAttachment'

    try {
        const url = `/api/emails/${encodeURIComponent(emailId)}/attachments/${attachmentIndex}`
        const response = await fetch(url)

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            const message = errorData?.error?.message ?? `Download failed with status ${response.status}`
            console.error(`[${functionName}] Download failed`, { emailId, attachmentIndex, message })
            return { success: false, error: message }
        }

        // Convert to blob and trigger browser download via a temporary anchor element
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)

        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = filename
        document.body.appendChild(anchor)
        anchor.click()

        // Clean up the temporary DOM element and object URL
        document.body.removeChild(anchor)
        URL.revokeObjectURL(objectUrl)

        return { success: true }
    } catch (error) {
        console.error(`[${functionName}] Failed to download attachment`, { emailId, attachmentIndex, error })

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to download attachment',
        }
    }
}

// Search emails by query string and field filters
export async function searchEmailsApi(params: {
    query: string
    fields: SearchField[]
    pageSize?: number
    cursor?: string
}): Promise<ApiResponse<SearchResult<EmailSummary>>> {
    const functionName = 'searchEmailsApi'

    try {
        const response = await fetch('/api/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: params.query,
                fields: params.fields,
                pageSize: params.pageSize,
                cursor: params.cursor,
            }),
        })
        const data: ApiResponse<SearchResult<EmailSummary>> = await response.json()

        return data
    } catch (error) {
        console.error(`[${functionName}] Failed to search emails`, { query: params.query, error })

        return {
            success: false,
            error: {
                code: 'SEARCH_EMAILS_FAILED',
                message: error instanceof Error ? error.message : 'Failed to search emails',
                functionName,
                details: { query: params.query, fields: params.fields },
            },
            timestamp: new Date().toISOString(),
        }
    }
}
