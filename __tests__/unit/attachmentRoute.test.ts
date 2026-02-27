// Unit tests for the attachment download API route
// Mocks S3 operations and email parser to test the route handler in isolation
import { NextRequest } from 'next/server'

// Mock logger before any imports that depend on it
jest.mock('@/lib/logger/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}))

// Mock S3 operations
jest.mock('@/lib/s3/s3Operations', () => ({
    getObject: jest.fn(),
}))

// Mock email parser extractAttachment
jest.mock('@/lib/email/emailParser', () => ({
    extractAttachment: jest.fn(),
}))

import { GET } from '@/app/api/emails/[id]/attachments/[index]/route'
import { getObject } from '@/lib/s3/s3Operations'
import { extractAttachment } from '@/lib/email/emailParser'
import { AppError } from '@/lib/errors/appError'

const mockedGetObject = getObject as jest.MockedFunction<typeof getObject>
const mockedExtractAttachment = extractAttachment as jest.MockedFunction<typeof extractAttachment>

// Helper to create a valid base64url email ID from an S3 key
function encodeEmailId(s3Key: string): string {
    return Buffer.from(s3Key, 'utf-8').toString('base64url')
}

describe('GET /api/emails/[id]/attachments/[index]', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return attachment binary with correct headers', async () => {
        const s3Key = 'emails/msg1'
        const emailId = encodeEmailId(s3Key)
        const fileContent = Buffer.from('Hello World')

        mockedGetObject.mockResolvedValue({
            body: 'raw-email-content',
            size: 1000,
            contentType: 'message/rfc822',
        })

        mockedExtractAttachment.mockResolvedValue({
            content: fileContent,
            filename: 'report.pdf',
            contentType: 'application/pdf',
            size: fileContent.length,
        })

        const request = new NextRequest('http://localhost/api/emails/test/attachments/0')
        const response = await GET(request, {
            params: Promise.resolve({ id: emailId, index: '0' }),
        })

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('application/pdf')
        expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="report.pdf"')
        expect(response.headers.get('Content-Length')).toBe(String(fileContent.length))
        expect(response.headers.get('Cache-Control')).toBe('private, no-cache')

        const body = await response.arrayBuffer()
        expect(Buffer.from(body).toString('utf-8')).toBe('Hello World')
    })

    it('should return 404 when attachment index is out of bounds', async () => {
        const s3Key = 'emails/msg1'
        const emailId = encodeEmailId(s3Key)

        mockedGetObject.mockResolvedValue({
            body: 'raw-email-content',
            size: 1000,
            contentType: 'message/rfc822',
        })

        mockedExtractAttachment.mockRejectedValue(
            new AppError({
                code: 'ATTACHMENT_NOT_FOUND',
                message: 'Attachment index 5 is out of bounds (total: 1)',
                functionName: 'extractAttachment',
                inputs: { attachmentIndex: 5, totalAttachments: 1 },
                statusCode: 404,
            }),
        )

        const request = new NextRequest('http://localhost/api/emails/test/attachments/5')
        const response = await GET(request, {
            params: Promise.resolve({ id: emailId, index: '5' }),
        })

        expect(response.status).toBe(404)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('ATTACHMENT_NOT_FOUND')
    })

    it('should return 400 for invalid index format', async () => {
        const emailId = encodeEmailId('emails/msg1')

        const request = new NextRequest('http://localhost/api/emails/test/attachments/abc')
        const response = await GET(request, {
            params: Promise.resolve({ id: emailId, index: 'abc' }),
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for negative index', async () => {
        const emailId = encodeEmailId('emails/msg1')

        const request = new NextRequest('http://localhost/api/emails/test/attachments/-1')
        const response = await GET(request, {
            params: Promise.resolve({ id: emailId, index: '-1' }),
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 500 when S3 fetch fails', async () => {
        const emailId = encodeEmailId('emails/msg1')

        mockedGetObject.mockRejectedValue(
            new AppError({
                code: 'S3_GET_FAILED',
                message: 'Failed to get S3 object',
                functionName: 'getObject',
                statusCode: 500,
            }),
        )

        const request = new NextRequest('http://localhost/api/emails/test/attachments/0')
        const response = await GET(request, {
            params: Promise.resolve({ id: emailId, index: '0' }),
        })

        expect(response.status).toBe(500)
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error.code).toBe('S3_GET_FAILED')
    })

    it('should pass correct S3 key decoded from email ID', async () => {
        const s3Key = 'emails/some-folder/msg123'
        const emailId = encodeEmailId(s3Key)
        const fileContent = Buffer.from('content')

        mockedGetObject.mockResolvedValue({
            body: 'raw-content',
            size: 500,
            contentType: 'message/rfc822',
        })

        mockedExtractAttachment.mockResolvedValue({
            content: fileContent,
            filename: 'file.txt',
            contentType: 'text/plain',
            size: fileContent.length,
        })

        const request = new NextRequest('http://localhost/api/emails/test/attachments/0')
        await GET(request, {
            params: Promise.resolve({ id: emailId, index: '0' }),
        })

        expect(mockedGetObject).toHaveBeenCalledWith(s3Key)
        expect(mockedExtractAttachment).toHaveBeenCalledWith('raw-content', 0)
    })
})
