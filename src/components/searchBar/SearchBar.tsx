// Search bar with debounced text input and field selection for email filtering
'use client'

import { useState, useEffect, useCallback } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import { SearchField } from '@/types/search'
import { Button } from '@/ui/button/Button'

import styles from './SearchBar.module.scss'

interface SearchBarProps {
    onSearch: (query: string, fields: SearchField[]) => void
    onClear: () => void
    isSearching: boolean
}

// Available search field options for the checkbox group
const FIELD_OPTIONS: { value: SearchField; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'subject', label: 'Subject' },
    { value: 'from', label: 'From' },
    { value: 'to', label: 'To' },
]

// Render a search input with field selection and debounced query dispatch
export function SearchBar({ onSearch, onClear, isSearching }: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [fields, setFields] = useState<SearchField[]>(['all'])
    const debouncedQuery = useDebounce(query, 300)

    // Trigger search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim()) {
            onSearch(debouncedQuery, fields)
        }
    }, [debouncedQuery, fields, onSearch])

    // Toggle a field option; selecting "all" deselects others and vice versa
    const toggleField = useCallback((field: SearchField) => {
        setFields((prev) => {
            if (field === 'all') {
                return ['all']
            }

            const withoutAll = prev.filter((f) => f !== 'all')

            if (withoutAll.includes(field)) {
                const next = withoutAll.filter((f) => f !== field)
                return next.length === 0 ? ['all'] : next
            }

            return [...withoutAll, field]
        })
    }, [])

    // Clear search input and notify parent
    const handleClear = useCallback(() => {
        setQuery('')
        setFields(['all'])
        onClear()
    }, [onClear])

    return (
        <div className={styles.searchBar}>
            <div className={styles.inputRow}>
                <span className={styles.searchIcon}>[Search]</span>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="Search emails..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search emails"
                />
                {isSearching && (
                    <Button variant="secondary" size="sm" onClick={handleClear}>
                        Clear
                    </Button>
                )}
            </div>
            <div className={styles.fields}>
                {FIELD_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.fieldLabel}>
                        <input
                            type="checkbox"
                            checked={fields.includes(option.value)}
                            onChange={() => toggleField(option.value)}
                            className={styles.checkbox}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    )
}
