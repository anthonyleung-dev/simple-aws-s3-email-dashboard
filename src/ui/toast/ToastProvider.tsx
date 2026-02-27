// Global toast notification provider with auto-dismiss and context-based API
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

import { Toast, ToastData, ToastType } from './Toast'

import styles from './ToastProvider.module.scss'

// Context shape exposing the addToast function
interface ToastContextValue {
    addToast: (message: string, type: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Default auto-dismiss duration in milliseconds
const DEFAULT_DURATION = 4000

let toastIdCounter = 0

// Provider component that manages toast state and renders the toast container
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([])

    // Add a new toast and schedule its auto-dismissal
    const addToast = useCallback((message: string, type: ToastType, duration: number = DEFAULT_DURATION) => {
        const id = `toast-${++toastIdCounter}`
        const newToast: ToastData = { id, message, type }

        setToasts((prev) => [...prev, newToast])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
    }, [])

    // Manually dismiss a toast by its id
    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {toasts.length > 0 && (
                <div className={styles.container}>
                    {toasts.map((toast) => (
                        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    )
}

// Hook to access toast notifications; throws if used outside ToastProvider
export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }

    return context
}
