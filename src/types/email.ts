// Email address representation used across list and detail views
export interface EmailAddress {
    name: string
    address: string
}

// Attachment metadata extracted from parsed email MIME parts
export interface Attachment {
    filename: string
    contentType: string
    size: number
    contentId?: string
}

// Summary for list view (parsed from headers only, keeping payload minimal)
export interface EmailSummary {
    id: string // base64url-encoded S3 key
    s3Key: string
    subject: string
    from: EmailAddress
    to: EmailAddress[]
    date: Date
    snippet: string // first 200 chars of text body
    hasAttachments: boolean
    size: number
}

// Full email detail including bodies and attachments
export interface EmailDetail extends EmailSummary {
    cc: EmailAddress[]
    bcc: EmailAddress[]
    textBody: string
    htmlBody: string // sanitized server-side
    attachments: Attachment[]
    headers: Record<string, string>
}
