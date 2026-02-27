// Debounce hook that delays value updates until a specified time has elapsed.
// Useful for search inputs to avoid excessive API calls on every keystroke.
'use client'

import { useState, useEffect } from 'react'

// Return a debounced version of the given value that only updates after the delay
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}
