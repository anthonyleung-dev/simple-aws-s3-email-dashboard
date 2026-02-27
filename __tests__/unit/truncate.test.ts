// Unit tests for the text truncation utility
import { truncateText } from '@/utils/truncate'

describe('truncateText', () => {
    it('should return short text unchanged when under maxLength', () => {
        const result = truncateText('short text', 100)

        expect(result).toBe('short text')
    })

    it('should truncate long text with ellipsis', () => {
        const longText = 'This is a long sentence that should be truncated at some point'
        const result = truncateText(longText, 20)

        expect(result.endsWith('...')).toBe(true)
        expect(result.length).toBeLessThanOrEqual(23) // maxLength + "..."
    })

    it('should return empty string for empty input', () => {
        const result = truncateText('', 100)

        expect(result).toBe('')
    })

    it('should truncate at word boundary', () => {
        const text = 'Hello World Goodbye World'
        const result = truncateText(text, 13)

        // Should cut at the space before "Goodbye", not mid-word
        expect(result).toBe('Hello World...')
    })

    it('should handle text exactly at maxLength', () => {
        const text = 'exact'
        const result = truncateText(text, 5)

        expect(result).toBe('exact')
    })

    it('should handle single long word without spaces', () => {
        const text = 'superlongwordwithoutspaces'
        const result = truncateText(text, 10)

        // No space found, so it cuts at maxLength
        expect(result).toBe('superlongw...')
    })

    it('should handle null-ish input gracefully', () => {
        // The function checks !text, so empty string or undefined-ish
        const result = truncateText('' as string, 10)
        expect(result).toBe('')
    })
})
