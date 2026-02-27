// Unit tests for the client-side email search filter
import { searchEmails } from '@/lib/email/emailSearch'
import { EmailSummary } from '@/types/email'

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

// Mock email data for search tests
const mockEmails: EmailSummary[] = [
    {
        id: 'id1',
        s3Key: 'key1',
        subject: 'Meeting Tomorrow',
        from: { name: 'Alice', address: 'alice@example.com' },
        to: [{ name: 'Bob', address: 'bob@example.com' }],
        date: new Date(),
        snippet: 'Reminder about tomorrow meeting',
        hasAttachments: false,
        size: 1000,
    },
    {
        id: 'id2',
        s3Key: 'key2',
        subject: 'Invoice #1234',
        from: { name: 'Billing', address: 'billing@company.com' },
        to: [{ name: 'Alice', address: 'alice@example.com' }],
        date: new Date(),
        snippet: 'Please find attached invoice',
        hasAttachments: true,
        size: 5000,
    },
]

describe('searchEmails', () => {
    describe('subject field', () => {
        it('should match emails by subject', () => {
            const results = searchEmails({
                query: 'Meeting',
                fields: ['subject'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id1')
        })

        it('should be case-insensitive', () => {
            const results = searchEmails({
                query: 'invoice',
                fields: ['subject'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id2')
        })
    })

    describe('from field', () => {
        it('should match by sender name', () => {
            const results = searchEmails({
                query: 'Alice',
                fields: ['from'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id1')
        })

        it('should match by sender address', () => {
            const results = searchEmails({
                query: 'billing@company.com',
                fields: ['from'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id2')
        })
    })

    describe('to field', () => {
        it('should match by recipient name', () => {
            const results = searchEmails({
                query: 'Bob',
                fields: ['to'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id1')
        })

        it('should match by recipient address', () => {
            const results = searchEmails({
                query: 'alice@example.com',
                fields: ['to'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id2')
        })
    })

    describe('all field', () => {
        it('should search across subject, from, to, and body', () => {
            const results = searchEmails({
                query: 'Alice',
                fields: ['all'],
                emails: mockEmails,
            })

            // Alice appears as from in email1 and as to in email2
            expect(results).toHaveLength(2)
        })

        it('should match body/snippet content', () => {
            const results = searchEmails({
                query: 'Reminder',
                fields: ['all'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id1')
        })
    })

    describe('empty query', () => {
        it('should return all emails when query is empty', () => {
            const results = searchEmails({
                query: '',
                fields: ['all'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(2)
        })

        it('should return all emails when query is only whitespace', () => {
            const results = searchEmails({
                query: '   ',
                fields: ['all'],
                emails: mockEmails,
            })

            expect(results).toHaveLength(2)
        })
    })

    describe('no matches', () => {
        it('should return empty array when nothing matches', () => {
            const results = searchEmails({
                query: 'nonexistent',
                fields: ['subject'],
                emails: mockEmails,
            })

            expect(results).toEqual([])
        })
    })

    describe('multiple fields', () => {
        it('should match if any of the specified fields match', () => {
            const results = searchEmails({
                query: 'Bob',
                fields: ['subject', 'to'],
                emails: mockEmails,
            })

            // Bob is in the "to" field of email1
            expect(results).toHaveLength(1)
            expect(results[0].id).toBe('id1')
        })
    })
})
