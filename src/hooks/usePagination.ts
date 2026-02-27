// Pagination state management hook for cursor-based navigation.
// Tracks cursor history to enable forward and backward page traversal.
'use client'

import { useState, useCallback } from 'react'

// Pagination state and navigation actions
interface UsePaginationReturn {
    currentCursor: string | undefined
    canGoBack: boolean
    goNext: (nextCursor: string) => void
    goPrev: () => void
    reset: () => void
}

// Manage cursor-based pagination with history for back navigation
export function usePagination(): UsePaginationReturn {
    const [cursors, setCursors] = useState<string[]>([])

    // The current cursor is the last one in the history, or undefined for the first page
    const currentCursor = cursors.length > 0 ? cursors[cursors.length - 1] : undefined
    const canGoBack = cursors.length > 0

    // Push a new cursor to navigate to the next page
    const goNext = useCallback((nextCursor: string) => {
        setCursors((prev) => [...prev, nextCursor])
    }, [])

    // Pop the last cursor to go back to the previous page
    const goPrev = useCallback(() => {
        setCursors((prev) => {
            if (prev.length === 0) return prev
            return prev.slice(0, -1)
        })
    }, [])

    // Clear all cursors to return to the first page
    const reset = useCallback(() => {
        setCursors([])
    }, [])

    return {
        currentCursor,
        canGoBack,
        goNext,
        goPrev,
        reset,
    }
}
