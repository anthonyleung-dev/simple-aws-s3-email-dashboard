// Single email detail and deletion API routes.
// GET returns full email content, DELETE removes the email from S3.

import { NextRequest, NextResponse } from 'next/server'

import logger from '@/lib/logger/logger'
import { getObject, deleteObject } from '@/lib/s3/s3Operations'
import { parseEmailDetail } from '@/lib/email/emailParser'
import { emailIdParamSchema } from '@/lib/validation/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'
import { ApiResponse } from '@/types/api'
import { EmailDetail } from '@/types/email'

// Decode base64url-encoded email ID back to the original S3 key
function decodeEmailId(id: string): string {
    return Buffer.from(id, 'base64url').toString('utf-8')
}

// GET /api/emails/[id] - Retrieve full email detail by ID
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<EmailDetail>>> {
    const functionName = 'GET /api/emails/[id]'

    try {
        const { id } = await params
        logger.info('Fetching email detail', { functionName, id })

        // Validate the ID parameter
        const validated = emailIdParamSchema.parse({ id })
        const s3Key = decodeEmailId(validated.id)

        logger.info('Decoded S3 key', { functionName, id: validated.id, s3Key })

        // Fetch the full email content from S3
        const result = await getObject(s3Key)

        // Parse the raw MIME content into a structured detail object
        const detail = await parseEmailDetail(result.body, s3Key, result.size)

        logger.info('Email detail fetched successfully', {
            functionName,
            id: validated.id,
            subject: detail.subject,
        })

        return NextResponse.json({
            success: true,
            data: detail,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return handleApiError(error, functionName)
    }
}

// DELETE /api/emails/[id] - Delete an email from S3 by ID
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<{ deletedId: string }>>> {
    const functionName = 'DELETE /api/emails/[id]'

    try {
        const { id } = await params
        logger.info('Deleting email', { functionName, id })

        // Validate the ID parameter
        const validated = emailIdParamSchema.parse({ id })
        const s3Key = decodeEmailId(validated.id)

        logger.info('Decoded S3 key for deletion', { functionName, id: validated.id, s3Key })

        // Remove the object from S3
        await deleteObject(s3Key)

        logger.info('Email deleted successfully', { functionName, id: validated.id })

        return NextResponse.json({
            success: true,
            data: { deletedId: validated.id },
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return handleApiError(error, functionName)
    }
}
