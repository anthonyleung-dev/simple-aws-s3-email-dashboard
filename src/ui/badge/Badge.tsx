// Small inline pill/label for status and category indicators
import { ReactNode } from 'react'

import styles from './Badge.module.scss'

interface BadgeProps {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    children: ReactNode
}

// Render a compact badge with variant-based coloring
export function Badge({ variant = 'default', children }: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]}`}>
            {children}
        </span>
    )
}
