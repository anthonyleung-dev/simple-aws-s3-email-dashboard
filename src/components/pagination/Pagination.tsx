// Cursor-based pagination controls with previous and next navigation
import { Button } from '@/ui/button/Button'

import styles from './Pagination.module.scss'

interface PaginationProps {
    hasMore: boolean
    canGoBack: boolean
    onNext: () => void
    onPrev: () => void
    loading: boolean
}

// Render prev/next navigation buttons with disabled state management
export function Pagination({ hasMore, canGoBack, onNext, onPrev, loading }: PaginationProps) {
    // Hide pagination when there is nothing to navigate
    if (!hasMore && !canGoBack) {
        return null
    }

    return (
        <div className={styles.pagination}>
            <Button
                variant="secondary"
                size="sm"
                onClick={onPrev}
                disabled={!canGoBack || loading}
            >
                Previous
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={onNext}
                disabled={!hasMore || loading}
                loading={loading}
            >
                Next
            </Button>
        </div>
    )
}
