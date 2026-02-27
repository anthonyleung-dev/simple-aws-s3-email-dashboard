// Email detail page loading a single email by id with delete confirmation
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { DeleteConfirm } from '@/components/deleteConfirm/DeleteConfirm'
import { EmailDetailView } from '@/components/emailDetail/EmailDetail'
import { useEmails } from '@/hooks/useEmails'
import { Spinner } from '@/ui/spinner/Spinner'
import { useToast } from '@/ui/toast/ToastProvider'

import styles from './page.module.scss'

// Render the email detail view with loading state and delete modal
export default function EmailDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { selectedEmail, loading, error, viewEmail, removeEmail } = useEmails()
    const { addToast } = useToast()
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const emailId = params.id as string

    // Load email detail on mount
    useEffect(() => {
        if (emailId) {
            viewEmail(emailId)
        }
    }, [emailId, viewEmail])

    // Navigate back to the inbox list
    const handleBack = useCallback(() => {
        router.push('/')
    }, [router])

    // Open the delete confirmation modal
    const handleDeleteClick = useCallback(() => {
        setShowDeleteModal(true)
    }, [])

    // Cancel deletion and close the modal
    const handleCancelDelete = useCallback(() => {
        setShowDeleteModal(false)
    }, [])

    // Confirm deletion, remove the email, and navigate back
    const handleConfirmDelete = useCallback(async () => {
        try {
            setDeleting(true)
            await removeEmail(emailId)
            addToast('Email deleted successfully', 'success')
            router.push('/')
        } catch (err) {
            console.error('[EmailDetailPage] Delete failed', err)
            addToast('Failed to delete email', 'error')
        } finally {
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }, [emailId, removeEmail, addToast, router])

    // Show loading spinner while fetching
    if (loading && !selectedEmail) {
        return (
            <div className={styles.loading}>
                <Spinner size="lg" />
            </div>
        )
    }

    // Show error message with retry
    if (error && !selectedEmail) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
                <button onClick={handleBack} type="button">Back to inbox</button>
            </div>
        )
    }

    // Guard against missing email data
    if (!selectedEmail) {
        return (
            <div className={styles.error}>
                <p>Email not found</p>
                <button onClick={handleBack} type="button">Back to inbox</button>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <EmailDetailView
                email={selectedEmail}
                onDelete={handleDeleteClick}
                onBack={handleBack}
            />
            <DeleteConfirm
                isOpen={showDeleteModal}
                emailSubject={selectedEmail.subject}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                loading={deleting}
            />
        </div>
    )
}
