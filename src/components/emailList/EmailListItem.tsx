// Single email row in the list view with from, subject, snippet, date, and attachment badge
import { EmailSummary } from '@/types/email'
import { Badge } from '@/ui/badge/Badge'
import { formatRelativeDate } from '@/utils/dateFormat'

import styles from './EmailListItem.module.scss'

interface EmailListItemProps {
    email: EmailSummary
    onClick: (id: string) => void
}

// Render a clickable email list row with truncated preview content
export function EmailListItem({ email, onClick }: EmailListItemProps) {
    // Format the sender display as "Name" or fallback to address
    const fromDisplay = email.from.name || email.from.address

    return (
        <div
            className={styles.item}
            onClick={() => onClick(email.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick(email.id)
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div className={styles.top}>
                <span className={styles.from}>{fromDisplay}</span>
                <span className={styles.date}>{formatRelativeDate(new Date(email.date))}</span>
            </div>
            <div className={styles.middle}>
                <span className={styles.subject}>{email.subject || '(No subject)'}</span>
                {email.hasAttachments && (
                    <Badge variant="default">[Attachment]</Badge>
                )}
            </div>
            <p className={styles.snippet}>{email.snippet}</p>
        </div>
    )
}
