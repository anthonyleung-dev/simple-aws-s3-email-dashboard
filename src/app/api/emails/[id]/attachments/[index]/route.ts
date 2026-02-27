// Attachment download API route.
// Fetches full email from S3, extracts the attachment at the given index, and streams the binary.

import { NextRequest, NextResponse } from 'next/server'

import logger from '@/lib/logger/logger'
import { getObject } from '@/lib/s3/s3Operations'
import { extractAttachment } from '@/lib/email/emailParser'
import { attachmentParamSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// Decode base64url-encoded email ID back to the original S3 key
function decodeEmailId(id: string): string {
    return Buffer.from(id, 'base64url').toString('utf-8')
}

// GET /api/emails/[id]/attachments/[index] - Download a single attachment by index
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; index: string }> },
): Promise<NextResponse> {
    const functionName = 'GET /api/emails/[id]/attachments/[index]'

    try {
        const { id, index } = await params
        logger.info('Fetching attachment', { functionName, id, index })

        // Validate path parameters
        const validated = attachmentParamSchema.parse({ id, index })
        const s3Key = decodeEmailId(validated.id)

        logger.info('Decoded S3 key for attachment', {
            functionName,
            id: validated.id,
            s3Key,
            attachmentIndex: validated.index,
        })

        // Fetch the full email content from S3
        const result = await getObject(s3Key)

        // Extract the requested attachment binary
        const attachment = await extractAttachment(result.body, validated.index)

        logger.info('Returning attachment', {
            functionName,
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
        })

        // Return the binary content with appropriate headers for browser download
        const body = new Uint8Array(attachment.content)
        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': attachment.contentType,
                'Content-Disposition': `attachment; filename="${attachment.filename}"`,
                'Content-Length': String(attachment.size),
                'Cache-Control': 'private, no-cache',
            },
        })
    } catch (error) {
        return handleApiError(error, functionName)
    }
}
