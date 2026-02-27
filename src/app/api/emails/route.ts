// Email listing and search API routes.
// GET returns paginated email summaries, POST performs filtered search.

import { NextRequest, NextResponse } from 'next/server'

import logger from '@/lib/logger/logger'
import { listObjects, getObjectPartial } from '@/lib/s3/s3Operations'
import { parseEmailSummary } from '@/lib/email/emailParser'
import { searchEmails } from '@/lib/email/emailSearch'
import { listEmailsQuerySchema, searchEmailsBodySchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'
import { ApiResponse, PaginatedResponse } from '@/types/api'
import { EmailSummary } from '@/types/email'
import { SearchResult } from '@/types/search'

// Number of bytes to fetch for header-only parsing
const PARTIAL_FETCH_BYTES = 8192

// Maximum number of concurrent email parse operations
const CONCURRENCY_LIMIT = 10

// Process items in batches with limited concurrency to avoid overwhelming S3
async function processWithConcurrency<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number,
): Promise<PromiseSettledResult<R>[]> {
    const results: PromiseSettledResult<R>[] = []
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency)
        const batchResults = await Promise.allSettled(batch.map(processor))
        results.push(...batchResults)
    }
    return results
}

// Fetch partial content and parse email summary for a single S3 object
async function fetchAndParseSummary(s3Key: string, size: number): Promise<EmailSummary> {
    const rawContent = await getObjectPartial(s3Key, PARTIAL_FETCH_BYTES)
    return parseEmailSummary(rawContent, s3Key, size)
}

// Extract successfully parsed summaries from settled results
function collectFulfilledSummaries(results: PromiseSettledResult<EmailSummary>[]): EmailSummary[] {
    const summaries: EmailSummary[] = []

    for (const result of results) {
        if (result.status === 'fulfilled') {
            summaries.push(result.value)
        } else {
            logger.warn('Failed to parse email summary', {
                functionName: 'collectFulfilledSummaries',
                reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
            })
        }
    }

    return summaries
}

// GET /api/emails - List emails with cursor-based pagination
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<EmailSummary>>>> {
    const functionName = 'GET /api/emails'

    try {
        logger.info('Listing emails', { functionName })

        // Parse and validate query parameters
        const { searchParams } = request.nextUrl
        const queryParams = listEmailsQuerySchema.parse({
            pageSize: searchParams.get('pageSize') ?? undefined,
            cursor: searchParams.get('cursor') ?? undefined,
        })

        logger.info('Query params validated', {
            functionName,
            pageSize: queryParams.pageSize,
            hasCursor: !!queryParams.cursor,
        })

        // Fetch object keys from S3
        const listResult = await listObjects({
            pageSize: queryParams.pageSize,
            cursor: queryParams.cursor,
        })

        // Fetch headers and parse summaries in parallel with concurrency limit
        const settledResults = await processWithConcurrency(
            listResult.objects,
            (obj) => fetchAndParseSummary(obj.key, obj.size),
            CONCURRENCY_LIMIT,
        )

        const summaries = collectFulfilledSummaries(settledResults)

        logger.info('Email listing completed', {
            functionName,
            totalObjects: listResult.objects.length,
            parsedCount: summaries.length,
            hasMore: listResult.hasMore,
        })

        return NextResponse.json({
            success: true,
            data: {
                items: summaries,
                nextCursor: listResult.nextCursor,
                hasMore: listResult.hasMore,
                totalFetched: summaries.length,
            },
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return handleApiError(error, functionName)
    }
}

// POST /api/emails - Search emails with query and field filters
export async function POST(
    request: NextRequest,
): Promise<NextResponse<ApiResponse<SearchResult<EmailSummary>>>> {
    const functionName = 'POST /api/emails'

    try {
        logger.info('Searching emails', { functionName })

        // Parse and validate request body
        const body = await request.json()
        const searchParams = searchEmailsBodySchema.parse(body)

        logger.info('Search params validated', {
            functionName,
            query: searchParams.query,
            fields: searchParams.fields,
            pageSize: searchParams.pageSize,
        })

        // Fetch object keys from S3 for the current page
        const listResult = await listObjects({
            pageSize: searchParams.pageSize,
            cursor: searchParams.cursor,
        })

        // Fetch headers and parse summaries in parallel with concurrency limit
        const settledResults = await processWithConcurrency(
            listResult.objects,
            (obj) => fetchAndParseSummary(obj.key, obj.size),
            CONCURRENCY_LIMIT,
        )

        const summaries = collectFulfilledSummaries(settledResults)

        // Filter parsed summaries by search criteria
        const matched = searchEmails({
            query: searchParams.query,
            fields: searchParams.fields,
            emails: summaries,
        })

        logger.info('Email search completed', {
            functionName,
            query: searchParams.query,
            totalParsed: summaries.length,
            matchedCount: matched.length,
            hasMore: listResult.hasMore,
        })

        return NextResponse.json({
            success: true,
            data: {
                items: matched,
                query: searchParams.query,
                fields: searchParams.fields,
                totalMatched: matched.length,
                hasMore: listResult.hasMore,
                nextCursor: listResult.nextCursor,
            },
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return handleApiError(error, functionName)
    }
}
