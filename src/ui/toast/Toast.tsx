// Individual toast notification with type-based icon indicator
import styles from './Toast.module.scss'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastData {
    id: string
    message: string
    type: ToastType
}

interface ToastProps {
    toast: ToastData
    onDismiss: (id: string) => void
}

// Map toast type to a text-based icon indicator
const TOAST_ICONS: Record<ToastType, string> = {
    success: '[OK]',
    error: '[!!]',
    info: '[i]',
}

// Render a single toast notification with icon, message, and dismiss button
export function Toast({ toast, onDismiss }: ToastProps) {
    return (
        <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
            <span className={styles.icon}>{TOAST_ICONS[toast.type]}</span>
            <span className={styles.message}>{toast.message}</span>
            <button
                className={styles.dismiss}
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                type="button"
            >
                X
            </button>
        </div>
    )
}
