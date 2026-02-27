// CSS-only spinning loader indicator with size variants
import styles from './Spinner.module.scss'

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
}

// Render a circular spinning animation using CSS border trick
export function Spinner({ size = 'md' }: SpinnerProps) {
    return (
        <div
            className={`${styles.spinner} ${styles[size]}`}
            role="status"
            aria-label="Loading"
        >
            <span className={styles.srOnly}>Loading...</span>
        </div>
    )
}
