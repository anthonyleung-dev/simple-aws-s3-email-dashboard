// Global loading fallback shown during route transitions
import { Spinner } from '@/ui/spinner/Spinner'

export default function Loading() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner size="lg" />
        </div>
    )
}
