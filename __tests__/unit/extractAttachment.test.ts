// Unit tests for extractAttachment function that retrieves attachment binary from raw MIME content
import { extractAttachment } from '@/lib/email/emailParser'
import { AppError } from '@/lib/errors/appError'

// Suppress logger output during tests
jest.mock('@/lib/logger/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}))

// Sample MIME email with a text file attachment
const emailWithAttachment = `From: sender@example.com
To: receiver@example.com
Subject: Email with attachment
Date: Thu, 27 Feb 2026 10:00:00 +0000
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="boundary-att"

--boundary-att
Content-Type: text/plain; charset=utf-8

This is the email body.
--boundary-att
Content-Type: text/plain; charset=utf-8; name="test.txt"
Content-Disposition: attachment; filename="test.txt"
Content-Transfer-Encoding: base64

SGVsbG8gV29ybGQ=
--boundary-att--`

// Sample MIME email with multiple attachments
const emailWithMultipleAttachments = `From: sender@example.com
To: receiver@example.com
Subject: Multiple attachments
Date: Thu, 27 Feb 2026 10:00:00 +0000
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="boundary-multi"

--boundary-multi
Content-Type: text/plain; charset=utf-8

Body text here.
--boundary-multi
Content-Type: text/plain; charset=utf-8; name="file1.txt"
Content-Disposition: attachment; filename="file1.txt"
Content-Transfer-Encoding: base64

Rmlyc3QgZmlsZQ==
--boundary-multi
Content-Type: application/json; name="data.json"
Content-Disposition: attachment; filename="data.json"
Content-Transfer-Encoding: base64

eyJrZXkiOiJ2YWx1ZSJ9
--boundary-multi--`

// Plain email with no attachments
const emailWithoutAttachments = `From: sender@example.com
To: receiver@example.com
Subject: Plain email
Date: Thu, 27 Feb 2026 10:00:00 +0000
Content-Type: text/plain; charset=utf-8

Just a plain email with no attachments.`

describe('extractAttachment', () => {
    it('should extract attachment at valid index 0', async () => {
        const result = await extractAttachment(emailWithAttachment, 0)

        expect(result.filename).toBe('test.txt')
        expect(result.contentType).toBe('text/plain')
        expect(result.content).toBeInstanceOf(Buffer)
        expect(result.content.toString('utf-8')).toBe('Hello World')
    })

    it('should extract the correct attachment from a multi-attachment email', async () => {
        const result = await extractAttachment(emailWithMultipleAttachments, 1)

        expect(result.filename).toBe('data.json')
        expect(result.contentType).toBe('application/json')
        expect(result.content.toString('utf-8')).toBe('{"key":"value"}')
    })

    it('should extract the first attachment from a multi-attachment email', async () => {
        const result = await extractAttachment(emailWithMultipleAttachments, 0)

        expect(result.filename).toBe('file1.txt')
        expect(result.content.toString('utf-8')).toBe('First file')
    })

    it('should throw ATTACHMENT_NOT_FOUND for negative index', async () => {
        await expect(extractAttachment(emailWithAttachment, -1)).rejects.toThrow(AppError)

        try {
            await extractAttachment(emailWithAttachment, -1)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('ATTACHMENT_NOT_FOUND')
            expect((error as AppError).statusCode).toBe(404)
        }
    })

    it('should throw ATTACHMENT_NOT_FOUND for out-of-bounds index', async () => {
        await expect(extractAttachment(emailWithAttachment, 5)).rejects.toThrow(AppError)

        try {
            await extractAttachment(emailWithAttachment, 5)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('ATTACHMENT_NOT_FOUND')
            expect((error as AppError).statusCode).toBe(404)
        }
    })

    it('should throw ATTACHMENT_NOT_FOUND for email with no attachments', async () => {
        await expect(extractAttachment(emailWithoutAttachments, 0)).rejects.toThrow(AppError)

        try {
            await extractAttachment(emailWithoutAttachments, 0)
        } catch (error) {
            expect(error).toBeInstanceOf(AppError)
            expect((error as AppError).code).toBe('ATTACHMENT_NOT_FOUND')
        }
    })

    it('should return correct size for the extracted attachment', async () => {
        const result = await extractAttachment(emailWithAttachment, 0)

        expect(result.size).toBeGreaterThan(0)
    })
})
