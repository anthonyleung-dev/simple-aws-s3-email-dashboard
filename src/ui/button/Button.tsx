// Reusable button with variant, size, and loading state support
import { ButtonHTMLAttributes, ReactNode } from 'react'

import { Spinner } from '@/ui/spinner/Spinner'

import styles from './Button.module.scss'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    children: ReactNode
}

// Render a styled button with optional loading spinner overlay
export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
}: ButtonProps) {
    const classNames = [
        styles.button,
        styles[variant],
        styles[size],
        loading ? styles.loading : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <button
            className={classNames}
            disabled={disabled || loading}
            type={type}
            {...rest}
        >
            {loading && (
                <span className={styles.spinnerWrapper}>
                    <Spinner size="sm" />
                </span>
            )}
            <span className={loading ? styles.hiddenText : ''}>
                {children}
            </span>
        </button>
    )
}
