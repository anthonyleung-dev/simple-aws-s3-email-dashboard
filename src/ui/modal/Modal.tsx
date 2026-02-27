// Modal dialog rendered via portal with backdrop overlay
'use client'

import { useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'

import styles from './Modal.module.scss'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
}

// Render a centered modal with overlay backdrop, escape key, and click-outside close
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    // Close on escape key press
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        },
        [onClose],
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleKeyDown])

    if (!isOpen) {
        return null
    }

    // Close when clicking the backdrop overlay, not the modal content
    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose()
        }
    }

    return createPortal(
        <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
                        type="button"
                    >
                        X
                    </button>
                </div>
                <div className={styles.body}>{children}</div>
            </div>
        </div>,
        document.body,
    )
}
