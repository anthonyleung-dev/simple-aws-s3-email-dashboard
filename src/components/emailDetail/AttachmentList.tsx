// Attachment list showing filename, content type badge, formatted file size, and download button
'use client'

import { useState } from 'react'

import { Attachment } from '@/types/email'
import { Badge } from '@/ui/badge/Badge'
import { Button } from '@/ui/button/Button'
import { useToast } from '@/ui/toast/ToastProvider'
import { downloadAttachment } from '@/services/emailService'

import styles from './AttachmentList.module.scss'

interface AttachmentListProps {
    attachments: Attachment[]
    emailId: string
}

// Format bytes to human-readable size string (KB, MB, etc.)
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    const base = 1024
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base))
    const size = bytes / Math.pow(base, unitIndex)

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

// Render a list of email attachments with file info, content type badges, and download actions
export function AttachmentList({ attachments, emailId }: AttachmentListProps) {
    const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({})
    const { addToast } = useToast()

    if (attachments.length === 0) {
        return null
    }

    // Handle download click for a specific attachment by index
    async function handleDownload(index: number, filename: string) {
        setLoadingMap((prev) => ({ ...prev, [index]: true }))

        try {
            const result = await downloadAttachment(emailId, index, filename)

            if (!result.success) {
                addToast(result.error ?? 'Failed to download attachment', 'error')
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to download attachment', 'error')
        } finally {
            setLoadingMap((prev) => ({ ...prev, [index]: false }))
        }
    }

    return (
        <div className={styles.attachments}>
            <h3 className={styles.title}>Attachments ({attachments.length})</h3>
            <ul className={styles.list}>
                {attachments.map((attachment, index) => (
                    <li key={`${attachment.filename}-${index}`} className={styles.item}>
                        <span className={styles.fileIcon}>[File]</span>
                        <span className={styles.filename}>{attachment.filename}</span>
                        <Badge variant="default">{attachment.contentType}</Badge>
                        <span className={styles.size}>{formatFileSize(attachment.size)}</span>
                        <Button
                            variant="secondary"
                            size="sm"
                            loading={loadingMap[index] ?? false}
                            className={styles.downloadButton}
                            onClick={() => handleDownload(index, attachment.filename)}
                        >
                            Download
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
