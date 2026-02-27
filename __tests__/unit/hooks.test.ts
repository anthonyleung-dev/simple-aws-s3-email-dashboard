/** @jest-environment jsdom */
// Unit tests for React hooks: useDebounce and usePagination
import { renderHook, act } from '@testing-library/react'

import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should return the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300))

        expect(result.current).toBe('hello')
    })

    it('should not update the value before the delay', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 300 },
        })

        rerender({ value: 'updated', delay: 300 })

        // Before the delay, value should still be the initial one
        expect(result.current).toBe('initial')
    })

    it('should update the value after the delay', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 300 },
        })

        rerender({ value: 'updated', delay: 300 })

        act(() => {
            jest.advanceTimersByTime(300)
        })

        expect(result.current).toBe('updated')
    })

    it('should reset the timer when value changes rapidly', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'first', delay: 300 },
        })

        rerender({ value: 'second', delay: 300 })

        act(() => {
            jest.advanceTimersByTime(200)
        })

        rerender({ value: 'third', delay: 300 })

        act(() => {
            jest.advanceTimersByTime(200)
        })

        // 200ms after "third", not yet 300ms, should still be "first"
        expect(result.current).toBe('first')

        act(() => {
            jest.advanceTimersByTime(100)
        })

        // Now 300ms after "third"
        expect(result.current).toBe('third')
    })
})

describe('usePagination', () => {
    it('should start with undefined cursor and canGoBack false', () => {
        const { result } = renderHook(() => usePagination())

        expect(result.current.currentCursor).toBeUndefined()
        expect(result.current.canGoBack).toBe(false)
    })

    it('should update cursor when goNext is called', () => {
        const { result } = renderHook(() => usePagination())

        act(() => {
            result.current.goNext('cursor-1')
        })

        expect(result.current.currentCursor).toBe('cursor-1')
        expect(result.current.canGoBack).toBe(true)
    })

    it('should navigate to previous page with goPrev', () => {
        const { result } = renderHook(() => usePagination())

        act(() => {
            result.current.goNext('cursor-1')
        })
        act(() => {
            result.current.goNext('cursor-2')
        })

        expect(result.current.currentCursor).toBe('cursor-2')

        act(() => {
            result.current.goPrev()
        })

        expect(result.current.currentCursor).toBe('cursor-1')
        expect(result.current.canGoBack).toBe(true)
    })

    it('should return to first page when all cursors are popped', () => {
        const { result } = renderHook(() => usePagination())

        act(() => {
            result.current.goNext('cursor-1')
        })
        act(() => {
            result.current.goPrev()
        })

        expect(result.current.currentCursor).toBeUndefined()
        expect(result.current.canGoBack).toBe(false)
    })

    it('should handle goPrev when already on first page', () => {
        const { result } = renderHook(() => usePagination())

        act(() => {
            result.current.goPrev()
        })

        expect(result.current.currentCursor).toBeUndefined()
        expect(result.current.canGoBack).toBe(false)
    })

    it('should reset to first page when reset is called', () => {
        const { result } = renderHook(() => usePagination())

        act(() => {
            result.current.goNext('cursor-1')
        })
        act(() => {
            result.current.goNext('cursor-2')
        })
        act(() => {
            result.current.goNext('cursor-3')
        })
        act(() => {
            result.current.reset()
        })

        expect(result.current.currentCursor).toBeUndefined()
        expect(result.current.canGoBack).toBe(false)
    })
})
