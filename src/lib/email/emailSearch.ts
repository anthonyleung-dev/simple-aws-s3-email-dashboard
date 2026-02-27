// Client-side email search filter that matches query terms against email summary fields.
// Supports searching by subject, from, to, body (snippet), and all fields combined.

import { EmailSummary } from '@/types/email'
import { SearchField } from '@/types/search'
import logger from '@/lib/logger/logger'
import { AppError } from '@/lib/errors/appError'

// Check if a single email matches the query against one specific field
function matchesField(email: EmailSummary, query: string, field: SearchField): boolean {
    const lowerQuery = query.toLowerCase()

    switch (field) {
        case 'subject':
            return email.subject.toLowerCase().includes(lowerQuery)

        case 'from':
            return (
                email.from.name.toLowerCase().includes(lowerQuery) ||
                email.from.address.toLowerCase().includes(lowerQuery)
            )

        case 'to':
            return email.to.some(
                (addr) =>
                    addr.name.toLowerCase().includes(lowerQuery) || addr.address.toLowerCase().includes(lowerQuery),
            )

        case 'body':
            return email.snippet.toLowerCase().includes(lowerQuery)

        case 'all':
            return (
                matchesField(email, query, 'subject') ||
                matchesField(email, query, 'from') ||
                matchesField(email, query, 'to') ||
                matchesField(email, query, 'body')
            )

        default:
            return false
    }
}

// Filter a list of emails by matching the query against the specified search fields
export function searchEmails(params: { query: string; fields: SearchField[]; emails: EmailSummary[] }): EmailSummary[] {
    const functionName = 'searchEmails'

    try {
        const { query, fields, emails } = params

        logger.info('Searching emails', {
            functionName,
            query,
            fields,
            emailCount: emails.length,
        })

        if (!query.trim()) {
            logger.info('Empty search query, returning all emails', { functionName })
            return emails
        }

        // An email matches if it matches the query in ANY of the specified fields
        const results = emails.filter((email) => fields.some((field) => matchesField(email, query, field)))

        logger.info('Search completed', {
            functionName,
            query,
            fields,
            inputCount: emails.length,
            matchedCount: results.length,
        })

        return results
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'EMAIL_SEARCH_FAILED',
            message: error instanceof Error ? error.message : 'Failed to search emails',
            functionName,
            inputs: { query: params.query, fields: params.fields, emailCount: params.emails.length },
            statusCode: 500,
        })
    }
}
