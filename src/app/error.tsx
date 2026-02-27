// Global error boundary catching unhandled errors with retry option
'use client'

import { useEffect } from 'react'

import { Button } from '@/ui/button/Button'

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

// Render a user-friendly error message with a retry button
export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('[GlobalError] Unhandled error', error)
    }, [error])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                gap: '16px',
            }}
        >
            <h2>Something went wrong</h2>
            <p style={{ color: '#475569', fontSize: '14px' }}>
                {error.message || 'An unexpected error occurred'}
            </p>
            <Button variant="primary" onClick={reset}>
                Try again
            </Button>
        </div>
    )
}
