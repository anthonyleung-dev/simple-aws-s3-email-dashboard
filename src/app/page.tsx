// Home page displaying email list with search and pagination
'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { EmailList } from '@/components/emailList/EmailList'
import { Pagination } from '@/components/pagination/Pagination'
import { SearchBar } from '@/components/searchBar/SearchBar'
import { useEmails } from '@/hooks/useEmails'
import { usePagination } from '@/hooks/usePagination'
import { SearchField } from '@/types/search'

import styles from './page.module.scss'

// Render the main email inbox view with search, list, and pagination
export default function HomePage() {
    const router = useRouter()
    const { emails, loading, pagination, isSearching, loadEmails, search, clearSearch } = useEmails()
    const { currentCursor, canGoBack, goNext, goPrev, reset } = usePagination()

    // Load emails on mount and when cursor changes
    useEffect(() => {
        loadEmails(currentCursor)
    }, [currentCursor, loadEmails])

    // Navigate to email detail page on click
    const handleEmailClick = useCallback(
        (id: string) => {
            router.push(`/email/${id}`)
        },
        [router],
    )

    // Handle search query submission
    const handleSearch = useCallback(
        (query: string, fields: SearchField[]) => {
            reset()
            search(query, fields)
        },
        [reset, search],
    )

    // Clear search and reset pagination
    const handleClearSearch = useCallback(() => {
        reset()
        clearSearch()
    }, [reset, clearSearch])

    // Navigate to next page using cursor
    const handleNext = useCallback(() => {
        if (pagination.nextCursor) {
            goNext(pagination.nextCursor)
        }
    }, [pagination.nextCursor, goNext])

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>S3 Email Dashboard</h1>
            </header>

            <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                isSearching={isSearching}
            />

            <EmailList
                emails={emails}
                loading={loading}
                onEmailClick={handleEmailClick}
            />

            <Pagination
                hasMore={pagination.hasMore}
                canGoBack={canGoBack}
                onNext={handleNext}
                onPrev={goPrev}
                loading={loading}
            />
        </div>
    )
}
