// Email context provider for managing global email state across the application.
// Uses useReducer for predictable state transitions and provides typed access via hook.
'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'

import { EmailSummary, EmailDetail } from '@/types/email'
import { SearchField } from '@/types/search'

// Shape of the email state managed by the reducer
interface EmailState {
    emails: EmailSummary[]
    selectedEmail: EmailDetail | null
    loading: boolean
    error: string | null
    pagination: {
        nextCursor?: string
        hasMore: boolean
        totalFetched: number
    }
    searchQuery: string
    searchFields: SearchField[]
    isSearching: boolean
}

// Discriminated union of all actions the reducer can handle
type EmailAction =
    | { type: 'SET_EMAILS'; payload: { emails: EmailSummary[]; nextCursor?: string; hasMore: boolean; totalFetched: number } }
    | { type: 'APPEND_EMAILS'; payload: { emails: EmailSummary[]; nextCursor?: string; hasMore: boolean; totalFetched: number } }
    | { type: 'SET_SELECTED'; payload: EmailDetail | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SEARCH'; payload: { query: string; fields: SearchField[] } }
    | { type: 'REMOVE_EMAIL'; payload: string }
    | { type: 'CLEAR_SEARCH' }

// Context value combining state and dispatch
interface EmailContextValue {
    state: EmailState
    dispatch: React.Dispatch<EmailAction>
}

// Initial state with empty values
const initialState: EmailState = {
    emails: [],
    selectedEmail: null,
    loading: false,
    error: null,
    pagination: {
        hasMore: false,
        totalFetched: 0,
    },
    searchQuery: '',
    searchFields: ['all'],
    isSearching: false,
}

// Reducer function handling all email state transitions
function emailReducer(state: EmailState, action: EmailAction): EmailState {
    switch (action.type) {
        case 'SET_EMAILS':
            return {
                ...state,
                emails: action.payload.emails,
                pagination: {
                    nextCursor: action.payload.nextCursor,
                    hasMore: action.payload.hasMore,
                    totalFetched: action.payload.totalFetched,
                },
                error: null,
            }

        case 'APPEND_EMAILS':
            return {
                ...state,
                emails: [...state.emails, ...action.payload.emails],
                pagination: {
                    nextCursor: action.payload.nextCursor,
                    hasMore: action.payload.hasMore,
                    totalFetched: state.pagination.totalFetched + action.payload.totalFetched,
                },
                error: null,
            }

        case 'SET_SELECTED':
            return {
                ...state,
                selectedEmail: action.payload,
            }

        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
            }

        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false,
            }

        case 'SET_SEARCH':
            return {
                ...state,
                searchQuery: action.payload.query,
                searchFields: action.payload.fields,
                isSearching: action.payload.query.trim().length > 0,
            }

        case 'REMOVE_EMAIL':
            return {
                ...state,
                emails: state.emails.filter((email) => email.id !== action.payload),
                selectedEmail:
                    state.selectedEmail?.id === action.payload ? null : state.selectedEmail,
                pagination: {
                    ...state.pagination,
                    totalFetched: Math.max(0, state.pagination.totalFetched - 1),
                },
            }

        case 'CLEAR_SEARCH':
            return {
                ...state,
                searchQuery: '',
                searchFields: ['all'],
                isSearching: false,
            }

        default:
            return state
    }
}

const EmailContext = createContext<EmailContextValue | null>(null)

// Provider component wrapping children with email state context
export function EmailProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(emailReducer, initialState)

    return (
        <EmailContext.Provider value={{ state, dispatch }}>
            {children}
        </EmailContext.Provider>
    )
}

// Hook to access email context; throws if used outside EmailProvider
export function useEmailContext(): EmailContextValue {
    const context = useContext(EmailContext)

    if (!context) {
        throw new Error('useEmailContext must be used within an EmailProvider')
    }

    return context
}
