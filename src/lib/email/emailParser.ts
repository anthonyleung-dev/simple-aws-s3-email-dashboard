// Email parser that converts raw MIME content into structured EmailSummary and EmailDetail objects.
// Uses mailparser for MIME parsing and sanitizes HTML body server-side.

import { simpleParser, AddressObject } from 'mailparser'

import { EmailAddress, EmailSummary, EmailDetail, Attachment } from '@/types/email'
import logger from '@/lib/logger/logger'
import { AppError } from '@/lib/errors/appError'

// Maximum length for the email snippet in list views
const SNIPPET_MAX_LENGTH = 200

// Convert a base64url-encoded S3 key to a safe email ID
function encodeEmailId(s3Key: string): string {
    return Buffer.from(s3Key, 'utf-8').toString('base64url')
}

// Extract EmailAddress array from a mailparser AddressObject
export function extractEmailAddress(addr: AddressObject | AddressObject[] | undefined): EmailAddress[] {
    if (!addr) {
        return []
    }

    // mailparser can return a single AddressObject or an array of them
    const addressObjects = Array.isArray(addr) ? addr : [addr]
    const result: EmailAddress[] = []

    for (const addrObj of addressObjects) {
        if (addrObj.value) {
            for (const entry of addrObj.value) {
                result.push({
                    name: entry.name ?? '',
                    address: entry.address ?? '',
                })
            }
        }
    }

    return result
}

// Check if raw email content indicates attachments are present
function detectAttachments(raw: string): boolean {
    const lowerRaw = raw.toLowerCase()
    return (
        lowerRaw.includes('content-disposition: attachment') ||
        (lowerRaw.includes('multipart/mixed') && lowerRaw.includes('filename='))
    )
}

// Parse raw email content into a lightweight EmailSummary for list views
export async function parseEmailSummary(raw: string, s3Key: string, size: number): Promise<EmailSummary> {
    const functionName = 'parseEmailSummary'

    try {
        logger.info('Parsing email summary', { functionName, s3Key, rawLength: raw.length })

        const parsed = await simpleParser(raw)

        const from = extractEmailAddress(parsed.from)
        const to = extractEmailAddress(parsed.to)

        // Build snippet from text body, trimmed to max length
        const textBody = parsed.text ?? ''
        const snippet = textBody.slice(0, SNIPPET_MAX_LENGTH).trim()

        // Detect attachments from raw content headers when doing partial parse
        const hasAttachments = detectAttachments(raw)

        const summary: EmailSummary = {
            id: encodeEmailId(s3Key),
            s3Key,
            subject: parsed.subject ?? '(No Subject)',
            from: from[0] ?? { name: '', address: '' },
            to,
            date: parsed.date ?? new Date(),
            snippet,
            hasAttachments,
            size,
        }

        logger.info('Parsed email summary successfully', {
            functionName,
            s3Key,
            subject: summary.subject,
        })

        return summary
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'EMAIL_PARSE_SUMMARY_FAILED',
            message: error instanceof Error ? error.message : 'Failed to parse email summary',
            functionName,
            inputs: { s3Key, rawLength: raw.length },
            statusCode: 500,
        })
    }
}

// Extract result for a single attachment binary
export interface ExtractedAttachment {
    content: Buffer
    filename: string
    contentType: string
    size: number
}

// Extract a single attachment by index from raw MIME email content
export async function extractAttachment(raw: string, attachmentIndex: number): Promise<ExtractedAttachment> {
    const functionName = 'extractAttachment'

    try {
        logger.info('Extracting attachment from email', { functionName, attachmentIndex, rawLength: raw.length })

        const parsed = await simpleParser(raw)
        const attachments = parsed.attachments ?? []

        if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
            throw new AppError({
                code: 'ATTACHMENT_NOT_FOUND',
                message: `Attachment index ${attachmentIndex} is out of bounds (total: ${attachments.length})`,
                functionName,
                inputs: { attachmentIndex, totalAttachments: attachments.length },
                statusCode: 404,
            })
        }

        const att = attachments[attachmentIndex]

        logger.info('Extracted attachment successfully', {
            functionName,
            attachmentIndex,
            filename: att.filename,
            contentType: att.contentType,
            size: att.size,
        })

        return {
            content: att.content,
            filename: att.filename ?? 'unnamed',
            contentType: att.contentType ?? 'application/octet-stream',
            size: att.size ?? 0,
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'ATTACHMENT_EXTRACT_FAILED',
            message: error instanceof Error ? error.message : 'Failed to extract attachment',
            functionName,
            inputs: { attachmentIndex },
            statusCode: 500,
        })
    }
}

// Parse raw email content into a full EmailDetail with bodies and attachment metadata
export async function parseEmailDetail(raw: string, s3Key: string, size: number): Promise<EmailDetail> {
    const functionName = 'parseEmailDetail'

    try {
        logger.info('Parsing email detail', { functionName, s3Key, rawLength: raw.length })

        const parsed = await simpleParser(raw)

        const from = extractEmailAddress(parsed.from)
        const to = extractEmailAddress(parsed.to)
        const cc = extractEmailAddress(parsed.cc)
        const bcc = extractEmailAddress(parsed.bcc)

        // Extract text and HTML bodies
        const textBody = parsed.text ?? ''
        const rawHtml = parsed.html || ''

        // Sanitize HTML body server-side to prevent XSS
        let htmlBody = ''
        if (rawHtml) {
            try {
                // Dynamic import to handle the sanitize util which may be loaded asynchronously
                const { sanitizeHtml } = await import('@/utils/sanitize')
                htmlBody = sanitizeHtml(rawHtml)
            } catch {
                logger.warn('Sanitize util not available, falling back to text body', { functionName })
                htmlBody = ''
            }
        }

        // Extract attachment metadata without binary content
        const attachments: Attachment[] = (parsed.attachments ?? []).map((att) => ({
            filename: att.filename ?? 'unnamed',
            contentType: att.contentType ?? 'application/octet-stream',
            size: att.size ?? 0,
            contentId: att.contentId || undefined,
        }))

        // Build headers record from parsed headers map
        const headers: Record<string, string> = {}
        if (parsed.headers) {
            parsed.headers.forEach((value, key) => {
                headers[key] = typeof value === 'string' ? value : JSON.stringify(value)
            })
        }

        const snippet = textBody.slice(0, SNIPPET_MAX_LENGTH).trim()
        const hasAttachments = attachments.length > 0

        const detail: EmailDetail = {
            id: encodeEmailId(s3Key),
            s3Key,
            subject: parsed.subject ?? '(No Subject)',
            from: from[0] ?? { name: '', address: '' },
            to,
            date: parsed.date ?? new Date(),
            snippet,
            hasAttachments,
            size,
            cc,
            bcc,
            textBody,
            htmlBody,
            attachments,
            headers,
        }

        logger.info('Parsed email detail successfully', {
            functionName,
            s3Key,
            subject: detail.subject,
            attachmentCount: attachments.length,
        })

        return detail
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'EMAIL_PARSE_DETAIL_FAILED',
            message: error instanceof Error ? error.message : 'Failed to parse email detail',
            functionName,
            inputs: { s3Key, rawLength: raw.length },
            statusCode: 500,
        })
    }
}
