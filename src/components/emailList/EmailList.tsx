// Email list container that renders items, loading state, or empty state
import { EmailSummary } from '@/types/email'
import { EmptyState } from '@/ui/emptyState/EmptyState'
import { Spinner } from '@/ui/spinner/Spinner'

import { EmailListItem } from './EmailListItem'

import styles from './EmailList.module.scss'

interface EmailListProps {
    emails: EmailSummary[]
    loading: boolean
    onEmailClick: (id: string) => void
}

// Render the email list with loading spinner or empty state fallback
export function EmailList({ emails, loading, onEmailClick }: EmailListProps) {
    if (loading && emails.length === 0) {
        return (
            <div className={styles.loading}>
                <Spinner size="lg" />
            </div>
        )
    }

    if (!loading && emails.length === 0) {
        return (
            <EmptyState
                title="No emails found"
                description="There are no emails to display. Try adjusting your search or check back later."
            />
        )
    }

    return (
        <div className={styles.list}>
            {emails.map((email) => (
                <EmailListItem
                    key={email.id}
                    email={email}
                    onClick={onEmailClick}
                />
            ))}
            {loading && (
                <div className={styles.loadingMore}>
                    <Spinner size="sm" />
                </div>
            )}
        </div>
    )
}
