// Unit tests for the email parser that converts raw MIME content to structured data
import { parseEmailSummary, parseEmailDetail, extractEmailAddress } from '@/lib/email/emailParser'
import { AddressObject } from 'mailparser'

// Mock the sanitize module to passthrough HTML
jest.mock('@/utils/sanitize', () => ({
    sanitizeHtml: (html: string) => html,
}))

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

// Sample raw MIME email for testing
const sampleEmail = `From: John Doe <john@example.com>
To: Jane Smith <jane@example.com>
Subject: Test Email Subject
Date: Thu, 27 Feb 2026 10:00:00 +0000
Content-Type: text/plain; charset=utf-8

This is the body of the test email. It contains some text for testing purposes.`

// Sample with HTML body
const sampleHtmlEmail = `From: John Doe <john@example.com>
To: Jane Smith <jane@example.com>
Subject: HTML Email
Date: Thu, 27 Feb 2026 10:00:00 +0000
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary123"

--boundary123
Content-Type: text/plain; charset=utf-8

Plain text version
--boundary123
Content-Type: text/html; charset=utf-8

<html><body><p>HTML version</p></body></html>
--boundary123--`

describe('emailParser', () => {
    describe('extractEmailAddress', () => {
        it('should return empty array for undefined input', () => {
            const result = extractEmailAddress(undefined)
            expect(result).toEqual([])
        })

        it('should extract address from a single AddressObject', () => {
            const addr: AddressObject = {
                value: [{ name: 'Alice', address: 'alice@test.com' }],
                html: '',
                text: '',
            }

            const result = extractEmailAddress(addr)

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ name: 'Alice', address: 'alice@test.com' })
        })

        it('should extract addresses from an array of AddressObjects', () => {
            const addrs: AddressObject[] = [
                {
                    value: [{ name: 'Alice', address: 'alice@test.com' }],
                    html: '',
                    text: '',
                },
                {
                    value: [{ name: 'Bob', address: 'bob@test.com' }],
                    html: '',
                    text: '',
                },
            ]

            const result = extractEmailAddress(addrs)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({ name: 'Alice', address: 'alice@test.com' })
            expect(result[1]).toEqual({ name: 'Bob', address: 'bob@test.com' })
        })

        it('should handle missing name and address with empty strings', () => {
            const addr: AddressObject = {
                value: [{ name: '', address: '' }],
                html: '',
                text: '',
            }

            const result = extractEmailAddress(addr)

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ name: '', address: '' })
        })

        it('should handle multiple entries in a single AddressObject', () => {
            const addr: AddressObject = {
                value: [
                    { name: 'Alice', address: 'alice@test.com' },
                    { name: 'Charlie', address: 'charlie@test.com' },
                ],
                html: '',
                text: '',
            }

            const result = extractEmailAddress(addr)

            expect(result).toHaveLength(2)
        })
    })

    describe('parseEmailSummary', () => {
        it('should parse subject from raw email', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.subject).toBe('Test Email Subject')
        })

        it('should parse from address', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.from.name).toBe('John Doe')
            expect(result.from.address).toBe('john@example.com')
        })

        it('should parse to address', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.to).toHaveLength(1)
            expect(result.to[0].name).toBe('Jane Smith')
            expect(result.to[0].address).toBe('jane@example.com')
        })

        it('should parse date', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.date).toBeInstanceOf(Date)
            expect(result.date.toISOString()).toBe('2026-02-27T10:00:00.000Z')
        })

        it('should generate snippet from text body', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.snippet).toContain('This is the body of the test email')
        })

        it('should generate a base64url-encoded id from s3Key', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.id).toBe(Buffer.from('emails/msg1', 'utf-8').toString('base64url'))
        })

        it('should set size from the provided parameter', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 2048)

            expect(result.size).toBe(2048)
        })

        it('should set hasAttachments to false for plain text email', async () => {
            const result = await parseEmailSummary(sampleEmail, 'emails/msg1', 1024)

            expect(result.hasAttachments).toBe(false)
        })
    })

    describe('parseEmailDetail', () => {
        it('should parse subject from raw email', async () => {
            const result = await parseEmailDetail(sampleEmail, 'emails/msg1', 1024)

            expect(result.subject).toBe('Test Email Subject')
        })

        it('should include textBody', async () => {
            const result = await parseEmailDetail(sampleEmail, 'emails/msg1', 1024)

            expect(result.textBody).toContain('This is the body of the test email')
        })

        it('should return empty htmlBody for plain text email', async () => {
            const result = await parseEmailDetail(sampleEmail, 'emails/msg1', 1024)

            expect(result.htmlBody).toBe('')
        })

        it('should parse HTML body from multipart email', async () => {
            const result = await parseEmailDetail(sampleHtmlEmail, 'emails/html1', 2048)

            expect(result.htmlBody).toContain('HTML version')
        })

        it('should include cc and bcc arrays', async () => {
            const result = await parseEmailDetail(sampleEmail, 'emails/msg1', 1024)

            expect(result.cc).toEqual([])
            expect(result.bcc).toEqual([])
        })

        it('should include attachments array', async () => {
            const result = await parseEmailDetail(sampleEmail, 'emails/msg1', 1024)

            expect(result.attachments).toEqual([])
        })

        it('should include headers record', async () => {
            const result = await parseEmailDetail(sampleEmail, 'emails/msg1', 1024)

            expect(result.headers).toBeDefined()
            expect(typeof result.headers).toBe('object')
            expect(result.headers['subject']).toBe('Test Email Subject')
        })
    })
})
