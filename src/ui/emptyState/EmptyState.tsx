// Centered placeholder block for empty list or search results
import { ReactNode } from 'react'

import styles from './EmptyState.module.scss'

interface EmptyStateProps {
    title: string
    description: string
    icon?: ReactNode
}

// Render a vertically centered empty state with optional icon, title, and description
export function EmptyState({ title, description, icon }: EmptyStateProps) {
    return (
        <div className={styles.emptyState}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
        </div>
    )
}
