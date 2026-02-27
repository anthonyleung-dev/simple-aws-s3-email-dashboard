// Centralized API error handler that converts errors into structured NextResponse objects.
// Handles AppError, ZodError, and generic Error instances with appropriate status codes.

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { ApiResponse } from '@/types/api'
import logger from '@/lib/logger/logger'
import { AppError } from '@/lib/errors/appError'

// Convert an unknown error into a structured JSON NextResponse with correct status code
export function handleApiError(error: unknown, functionName: string): NextResponse<ApiResponse<never>> {
    try {
        // Handle known AppError with structured code and status
        if (error instanceof AppError) {
            logger.error('AppError caught', {
                code: error.code,
                message: error.message,
                functionName: error.functionName,
                inputs: error.inputs,
                statusCode: error.statusCode,
            })

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: error.code,
                        message: error.message,
                        functionName: error.functionName,
                        details: error.inputs,
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: error.statusCode },
            )
        }

        // Handle Zod validation errors with 400 status
        if (error instanceof ZodError) {
            const issues = error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            }))

            logger.warn('Validation error', {
                functionName,
                issues,
            })

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request validation failed',
                        functionName,
                        details: { issues },
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 400 },
            )
        }

        // Handle generic Error instances with 500 status
        if (error instanceof Error) {
            logger.error('Unexpected error', {
                functionName,
                message: error.message,
                stack: error.stack,
            })

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: error.message,
                        functionName,
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 500 },
            )
        }

        // Fallback for non-Error thrown values
        logger.error('Unknown error type', {
            functionName,
            error: String(error),
        })

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: 'An unexpected error occurred',
                    functionName,
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        )
    } catch (handlerError) {
        // Safety net if the error handler itself throws
        logger.error('Error handler failed', {
            functionName,
            handlerError: handlerError instanceof Error ? handlerError.message : String(handlerError),
        })

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'ERROR_HANDLER_FAILURE',
                    message: 'Failed to process error response',
                    functionName,
                },
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        )
    }
}
