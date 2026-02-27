// Unit tests for date formatting utilities
import { formatRelativeDate, formatFullDate } from '@/utils/dateFormat'

describe('formatRelativeDate', () => {
    it('should return "just now" for dates less than 1 minute ago', () => {
        const now = new Date()
        const result = formatRelativeDate(now)

        expect(result).toBe('just now')
    })

    it('should return "Xm ago" for dates less than 1 hour ago', () => {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
        const result = formatRelativeDate(thirtyMinAgo)

        expect(result).toBe('30m ago')
    })

    it('should return "1m ago" for dates about 1 minute ago', () => {
        const oneMinAgo = new Date(Date.now() - 61 * 1000)
        const result = formatRelativeDate(oneMinAgo)

        expect(result).toBe('1m ago')
    })

    it('should return "Xh ago" for dates less than 24 hours ago', () => {
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
        const result = formatRelativeDate(fiveHoursAgo)

        expect(result).toBe('5h ago')
    })

    it('should return "yesterday" for dates from yesterday', () => {
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        // Set to midday to ensure it is within the "yesterday" calendar day
        yesterday.setHours(12, 0, 0, 0)

        const result = formatRelativeDate(yesterday)

        expect(result).toBe('yesterday')
    })

    it('should return a formatted date for older dates', () => {
        // Use a date clearly in the past (more than 2 days ago, same year)
        const now = new Date()
        const oldDate = new Date(now.getFullYear(), 0, 5, 12, 0, 0)
        // Only test if the date is more than 2 days old
        if (now.getTime() - oldDate.getTime() > 2 * 86_400_000) {
            const result = formatRelativeDate(oldDate)

            // Should be a formatted string like "Jan 5"
            expect(result).toMatch(/\w+ \d+/)
        }
    })

    it('should include year in formatted date for different year', () => {
        const oldDate = new Date(2020, 5, 15, 12, 0, 0)
        const result = formatRelativeDate(oldDate)

        // Should include 2020 in the output
        expect(result).toContain('2020')
    })
})

describe('formatFullDate', () => {
    it('should return a formatted date string', () => {
        const date = new Date('2026-02-27T15:45:00Z')
        const result = formatFullDate(date)

        // Should contain month, day, year, and time components
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('should include month abbreviation', () => {
        const date = new Date('2026-02-27T15:45:00Z')
        const result = formatFullDate(date)

        expect(result).toMatch(/Feb/)
    })

    it('should include year', () => {
        const date = new Date('2026-02-27T15:45:00Z')
        const result = formatFullDate(date)

        expect(result).toContain('2026')
    })
})
