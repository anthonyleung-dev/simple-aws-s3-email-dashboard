// Utility functions for formatting email dates in relative and absolute forms

const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

/**
 * Formats a date as a human-readable relative string.
 * Returns "just now", "Xm ago", "Xh ago", "yesterday", or a short date.
 */
export function formatRelativeDate(date: Date): string {
    try {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()

        // Future dates or less than 1 minute ago
        if (diffMs < MINUTE_MS) {
            return 'just now'
        }

        // Less than 1 hour ago
        if (diffMs < HOUR_MS) {
            const minutes = Math.floor(diffMs / MINUTE_MS)
            return `${minutes}m ago`
        }

        // Less than 24 hours ago
        if (diffMs < DAY_MS) {
            const hours = Math.floor(diffMs / HOUR_MS)
            return `${hours}h ago`
        }

        // Check if it was yesterday
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        if (
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()
        ) {
            return 'yesterday'
        }

        // Older dates: show short formatted date
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        })
    } catch (error) {
        console.error('[formatRelativeDate] Failed to format date', {
            functionName: 'formatRelativeDate',
            input: date,
            error,
        })
        return 'unknown date'
    }
}

/**
 * Formats a date as a full human-readable string.
 * Example output: "Feb 27, 2026, 3:45 PM"
 */
export function formatFullDate(date: Date): string {
    try {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
    } catch (error) {
        console.error('[formatFullDate] Failed to format date', {
            functionName: 'formatFullDate',
            input: date,
            error,
        })
        return 'unknown date'
    }
}
