// Main email hook combining context state with service call actions.
// Provides a single interface for loading, searching, viewing, and deleting emails.
'use client'

import { useCallback } from 'react'

import { useEmailContext } from '@/context/EmailContext'
import { fetchEmails, fetchEmailDetail, deleteEmail, searchEmailsApi } from '@/services/emailService'
import { EmailSummary, EmailDetail } from '@/types/email'
import { SearchField } from '@/types/search'

// Return type exposing state and all available actions
interface UseEmailsReturn {
    emails: EmailSummary[]
    selectedEmail: EmailDetail | null
    loading: boolean
    error: string | null
    pagination: {
        nextCursor?: string
        hasMore: boolean
        totalFetched: number
    }
    searchQuery: string
    isSearching: boolean
    loadEmails: (cursor?: string) => Promise<void>
    loadMore: () => Promise<void>
    viewEmail: (id: string) => Promise<void>
    removeEmail: (id: string) => Promise<void>
    search: (query: string, fields: SearchField[]) => Promise<void>
    clearSearch: () => Promise<void>
}

// Combine email context with service layer for a unified data-fetching interface
export function useEmails(): UseEmailsReturn {
    const { state, dispatch } = useEmailContext()

    // Fetch emails for the given cursor and replace the current list
    const loadEmails = useCallback(
        async (cursor?: string) => {
            const functionName = 'useEmails.loadEmails'

            try {
                dispatch({ type: 'SET_LOADING', payload: true })

                const response = await fetchEmails({ cursor })

                if (response.success && response.data) {
                    dispatch({
                        type: 'SET_EMAILS',
                        payload: {
                            emails: response.data.items,
                            nextCursor: response.data.nextCursor,
                            hasMore: response.data.hasMore,
                            totalFetched: response.data.totalFetched,
                        },
                    })
                } else {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: response.error?.message ?? 'Failed to load emails',
                    })
                }
            } catch (error) {
                console.error(`[${functionName}] Unexpected error`, error)
                dispatch({
                    type: 'SET_ERROR',
                    payload: error instanceof Error ? error.message : 'Failed to load emails',
                })
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [dispatch],
    )

    // Fetch the next page and append results to the existing list
    const loadMore = useCallback(async () => {
        const functionName = 'useEmails.loadMore'

        if (!state.pagination.hasMore || !state.pagination.nextCursor) {
            return
        }

        try {
            dispatch({ type: 'SET_LOADING', payload: true })

            const response = await fetchEmails({ cursor: state.pagination.nextCursor })

            if (response.success && response.data) {
                dispatch({
                    type: 'APPEND_EMAILS',
                    payload: {
                        emails: response.data.items,
                        nextCursor: response.data.nextCursor,
                        hasMore: response.data.hasMore,
                        totalFetched: response.data.totalFetched,
                    },
                })
            } else {
                dispatch({
                    type: 'SET_ERROR',
                    payload: response.error?.message ?? 'Failed to load more emails',
                })
            }
        } catch (error) {
            console.error(`[${functionName}] Unexpected error`, error)
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'Failed to load more emails',
            })
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false })
        }
    }, [dispatch, state.pagination.hasMore, state.pagination.nextCursor])

    // Fetch full detail for a specific email and set it as selected
    const viewEmail = useCallback(
        async (id: string) => {
            const functionName = 'useEmails.viewEmail'

            try {
                dispatch({ type: 'SET_LOADING', payload: true })

                const response = await fetchEmailDetail(id)

                if (response.success && response.data) {
                    dispatch({ type: 'SET_SELECTED', payload: response.data })
                } else {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: response.error?.message ?? 'Failed to load email detail',
                    })
                }
            } catch (error) {
                console.error(`[${functionName}] Unexpected error`, error)
                dispatch({
                    type: 'SET_ERROR',
                    payload: error instanceof Error ? error.message : 'Failed to load email detail',
                })
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [dispatch],
    )

    // Delete an email and remove it from the local list
    const removeEmail = useCallback(
        async (id: string) => {
            const functionName = 'useEmails.removeEmail'

            try {
                dispatch({ type: 'SET_LOADING', payload: true })

                const response = await deleteEmail(id)

                if (response.success) {
                    dispatch({ type: 'REMOVE_EMAIL', payload: id })
                } else {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: response.error?.message ?? 'Failed to delete email',
                    })
                }
            } catch (error) {
                console.error(`[${functionName}] Unexpected error`, error)
                dispatch({
                    type: 'SET_ERROR',
                    payload: error instanceof Error ? error.message : 'Failed to delete email',
                })
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [dispatch],
    )

    // Search emails with query and field filters, replacing the current list with results
    const search = useCallback(
        async (query: string, fields: SearchField[]) => {
            const functionName = 'useEmails.search'

            try {
                dispatch({ type: 'SET_SEARCH', payload: { query, fields } })
                dispatch({ type: 'SET_LOADING', payload: true })

                const response = await searchEmailsApi({ query, fields })

                if (response.success && response.data) {
                    dispatch({
                        type: 'SET_EMAILS',
                        payload: {
                            emails: response.data.items,
                            nextCursor: response.data.nextCursor,
                            hasMore: response.data.hasMore,
                            totalFetched: response.data.totalMatched,
                        },
                    })
                } else {
                    dispatch({
                        type: 'SET_ERROR',
                        payload: response.error?.message ?? 'Search failed',
                    })
                }
            } catch (error) {
                console.error(`[${functionName}] Unexpected error`, error)
                dispatch({
                    type: 'SET_ERROR',
                    payload: error instanceof Error ? error.message : 'Search failed',
                })
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false })
            }
        },
        [dispatch],
    )

    // Clear search state and reload the default email list
    const clearSearch = useCallback(async () => {
        dispatch({ type: 'CLEAR_SEARCH' })
        await loadEmails()
    }, [dispatch, loadEmails])

    return {
        emails: state.emails,
        selectedEmail: state.selectedEmail,
        loading: state.loading,
        error: state.error,
        pagination: state.pagination,
        searchQuery: state.searchQuery,
        isSearching: state.isSearching,
        loadEmails,
        loadMore,
        viewEmail,
        removeEmail,
        search,
        clearSearch,
    }
}
