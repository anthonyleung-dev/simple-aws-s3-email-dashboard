// Confirmation dialog for email deletion using Modal component
import { Button } from '@/ui/button/Button'
import { Modal } from '@/ui/modal/Modal'

import styles from './DeleteConfirm.module.scss'

interface DeleteConfirmProps {
    isOpen: boolean
    emailSubject: string
    onConfirm: () => void
    onCancel: () => void
    loading: boolean
}

// Render a modal with warning message and cancel/delete action buttons
export function DeleteConfirm({ isOpen, emailSubject, onConfirm, onCancel, loading }: DeleteConfirmProps) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Delete Email">
            <div className={styles.content}>
                <p className={styles.warning}>
                    Are you sure you want to delete:
                </p>
                <p className={styles.subject}>{emailSubject || '(No subject)'}</p>
                <p className={styles.note}>This action cannot be undone.</p>
                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
