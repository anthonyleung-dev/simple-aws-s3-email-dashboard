// Utility for truncating text at word boundaries with ellipsis

/**
 * Truncates text to a maximum length, cutting at the nearest word boundary.
 * Appends ellipsis if text was truncated.
 * Returns the original text if it is shorter than maxLength.
 */
export function truncateText(text: string, maxLength: number): string {
    try {
        if (!text || text.length <= maxLength) {
            return text ?? ''
        }

        // Find the last space before the max length to avoid cutting mid-word
        const truncated = text.slice(0, maxLength)
        const lastSpaceIndex = truncated.lastIndexOf(' ')

        // If no space found, cut at maxLength directly
        const cutPoint = lastSpaceIndex > 0 ? lastSpaceIndex : maxLength

        return `${truncated.slice(0, cutPoint)}...`
    } catch (error) {
        console.error('[truncateText] Failed to truncate text', {
            functionName: 'truncateText',
            inputLength: text?.length ?? 0,
            maxLength,
            error,
        })
        return text ?? ''
    }
}
