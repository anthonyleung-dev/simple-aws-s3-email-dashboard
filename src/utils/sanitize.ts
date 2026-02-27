// Server-side HTML sanitization for email body content using DOMPurify + jsdom

import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Create a jsdom window instance for server-side DOMPurify usage
const domWindow = new JSDOM('').window
const purify = DOMPurify(domWindow as unknown as Parameters<typeof DOMPurify>[0])

// Configure allowed tags and attributes for safe email rendering
purify.setConfig({
    ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'hr',
        'ul',
        'ol',
        'li',
        'a',
        'b',
        'strong',
        'i',
        'em',
        'u',
        'span',
        'div',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'img',
        'blockquote',
        'pre',
        'code',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'target', 'width', 'height', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
})

/**
 * Sanitizes HTML content from email bodies by stripping dangerous tags and attributes.
 * Uses DOMPurify with jsdom for server-side execution.
 * Returns empty string on failure as a safe fallback.
 */
export function sanitizeHtml(html: string): string {
    try {
        if (!html) {
            return ''
        }

        const sanitized = purify.sanitize(html)
        console.debug('[sanitizeHtml] Sanitized HTML content', {
            functionName: 'sanitizeHtml',
            inputLength: html.length,
            outputLength: sanitized.length,
        })
        return sanitized
    } catch (error) {
        console.error('[sanitizeHtml] Failed to sanitize HTML', {
            functionName: 'sanitizeHtml',
            inputLength: html?.length ?? 0,
            error,
        })
        return ''
    }
}
