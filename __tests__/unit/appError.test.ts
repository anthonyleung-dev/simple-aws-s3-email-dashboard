// Unit tests for the AppError custom error class
import { AppError } from '@/lib/errors/appError'

describe('AppError', () => {
    it('should be an instance of Error', () => {
        const err = new AppError({
            code: 'TEST_ERROR',
            message: 'test message',
            functionName: 'testFunction',
        })

        expect(err).toBeInstanceOf(Error)
    })

    it('should have name set to AppError', () => {
        const err = new AppError({
            code: 'TEST_ERROR',
            message: 'test message',
            functionName: 'testFunction',
        })

        expect(err.name).toBe('AppError')
    })

    it('should set code, message, and functionName properties', () => {
        const err = new AppError({
            code: 'VALIDATION_FAILED',
            message: 'Invalid input',
            functionName: 'validateUser',
        })

        expect(err.code).toBe('VALIDATION_FAILED')
        expect(err.message).toBe('Invalid input')
        expect(err.functionName).toBe('validateUser')
    })

    it('should default statusCode to 500 when not provided', () => {
        const err = new AppError({
            code: 'TEST_ERROR',
            message: 'test',
            functionName: 'test',
        })

        expect(err.statusCode).toBe(500)
    })

    it('should use provided statusCode when given', () => {
        const err = new AppError({
            code: 'NOT_FOUND',
            message: 'Resource not found',
            functionName: 'findResource',
            statusCode: 404,
        })

        expect(err.statusCode).toBe(404)
    })

    it('should store inputs when provided', () => {
        const inputs = { userId: 123, action: 'delete' }
        const err = new AppError({
            code: 'ACTION_FAILED',
            message: 'Action failed',
            functionName: 'performAction',
            inputs,
        })

        expect(err.inputs).toEqual(inputs)
    })

    it('should have undefined inputs when not provided', () => {
        const err = new AppError({
            code: 'TEST_ERROR',
            message: 'test',
            functionName: 'test',
        })

        expect(err.inputs).toBeUndefined()
    })

    it('should be catchable as an Error', () => {
        try {
            throw new AppError({
                code: 'THROWN',
                message: 'thrown error',
                functionName: 'throwTest',
            })
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
            expect(e).toBeInstanceOf(AppError)
            expect((e as AppError).code).toBe('THROWN')
        }
    })
})
