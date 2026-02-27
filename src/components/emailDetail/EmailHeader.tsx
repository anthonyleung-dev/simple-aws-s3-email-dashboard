// Email detail header showing from, to, cc, date, and subject
import { EmailDetail } from '@/types/email'
import { EmailAddress } from '@/types/email'
import { formatFullDate } from '@/utils/dateFormat'

import styles from './EmailHeader.module.scss'

interface EmailHeaderProps {
    email: EmailDetail
}

// Format an address as "Name <address>" or just address if no name
function formatAddress(addr: EmailAddress): string {
    if (addr.name) {
        return `${addr.name} <${addr.address}>`
    }
    return addr.address
}

// Format a list of addresses as comma-separated string
function formatAddressList(addresses: EmailAddress[]): string {
    return addresses.map(formatAddress).join(', ')
}

// Render the email metadata header with sender, recipients, date, and subject
export function EmailHeader({ email }: EmailHeaderProps) {
    return (
        <div className={styles.header}>
            <h1 className={styles.subject}>{email.subject || '(No subject)'}</h1>
            <div className={styles.meta}>
                <div className={styles.field}>
                    <span className={styles.label}>From:</span>
                    <span className={styles.value}>{formatAddress(email.from)}</span>
                </div>
                <div className={styles.field}>
                    <span className={styles.label}>To:</span>
                    <span className={styles.value}>{formatAddressList(email.to)}</span>
                </div>
                {email.cc.length > 0 && (
                    <div className={styles.field}>
                        <span className={styles.label}>CC:</span>
                        <span className={styles.value}>{formatAddressList(email.cc)}</span>
                    </div>
                )}
                <div className={styles.field}>
                    <span className={styles.label}>Date:</span>
                    <span className={styles.value}>{formatFullDate(new Date(email.date))}</span>
                </div>
            </div>
        </div>
    )
}
