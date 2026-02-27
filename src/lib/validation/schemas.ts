// Zod validation schemas for API request parameters.
// Used by route handlers to validate query params and request bodies.

import { z } from 'zod'

// Valid search field values matching the SearchField type
const SEARCH_FIELDS = ['subject', 'from', 'to', 'body', 'all'] as const

// Schema for GET /api/emails query parameters (list with pagination)
export const listEmailsQuerySchema = z.object({
    pageSize: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 50))
        .pipe(z.number().int().min(1).max(100)),
    cursor: z.string().optional(),
})

// Schema for POST /api/emails/search request body
export const searchEmailsBodySchema = z.object({
    query: z.string().min(1, 'Search query must not be empty'),
    fields: z.array(z.enum(SEARCH_FIELDS)).min(1, 'At least one search field is required'),
    pageSize: z.number().int().min(1).max(100).optional().default(50),
    cursor: z.string().optional(),
})

// Schema for email ID path parameter (base64url-encoded S3 key)
export const emailIdParamSchema = z.object({
    id: z.string().min(1, 'Email ID is required'),
})

// Schema for attachment download path parameters (email ID + attachment index)
export const attachmentParamSchema = z.object({
    id: z.string().min(1, 'Email ID is required'),
    index: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(0, 'Attachment index must be a non-negative integer')),
})
