// Full email detail view composing header, body, and attachment list
import { EmailDetail as EmailDetailType } from '@/types/email'
import { Button } from '@/ui/button/Button'

import { AttachmentList } from './AttachmentList'
import { EmailBody } from './EmailBody'
import { EmailHeader } from './EmailHeader'

import styles from './EmailDetail.module.scss'

interface EmailDetailProps {
    email: EmailDetailType
    onDelete: () => void
    onBack: () => void
}

// Render the full email detail with navigation and delete controls
export function EmailDetailView({ email, onDelete, onBack }: EmailDetailProps) {
    return (
        <div className={styles.detail}>
            <div className={styles.toolbar}>
                <Button variant="secondary" size="sm" onClick={onBack}>
                    Back
                </Button>
                <Button variant="danger" size="sm" onClick={onDelete}>
                    Delete
                </Button>
            </div>
            <div className={styles.content}>
                <EmailHeader email={email} />
                <EmailBody htmlBody={email.htmlBody} textBody={email.textBody} />
                <AttachmentList attachments={email.attachments} emailId={email.id} />
            </div>
        </div>
    )
}
