// Unit tests for the structured JSON logger
import logger from '@/lib/logger/logger'

describe('logger', () => {
    let consoleSpy: {
        log: jest.SpyInstance
        warn: jest.SpyInstance
        error: jest.SpyInstance
    }

    beforeEach(() => {
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation(),
        }
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    // Helper to parse the JSON output from the console spy
    function parseLogOutput(spy: jest.SpyInstance): Record<string, unknown> {
        expect(spy).toHaveBeenCalledTimes(1)
        const raw = spy.mock.calls[0][0] as string
        return JSON.parse(raw)
    }

    describe('info', () => {
        it('should output JSON with timestamp, level, and message to console.log', () => {
            logger.info('test message')
            const output = parseLogOutput(consoleSpy.log)

            expect(output.level).toBe('info')
            expect(output.message).toBe('test message')
            expect(output.timestamp).toBeDefined()
            expect(typeof output.timestamp).toBe('string')
        })

        it('should include optional context when provided', () => {
            logger.info('with context', { userId: 42 })
            const output = parseLogOutput(consoleSpy.log)

            expect(output.level).toBe('info')
            expect(output.message).toBe('with context')
            expect(output.context).toEqual({ userId: 42 })
        })

        it('should not include context key when context is omitted', () => {
            logger.info('no context')
            const output = parseLogOutput(consoleSpy.log)

            expect(output).not.toHaveProperty('context')
        })
    })

    describe('debug', () => {
        it('should output JSON with debug level to console.log', () => {
            logger.debug('debug message')
            const output = parseLogOutput(consoleSpy.log)

            expect(output.level).toBe('debug')
            expect(output.message).toBe('debug message')
            expect(output.timestamp).toBeDefined()
        })

        it('should include context when provided', () => {
            logger.debug('debug with context', { key: 'value' })
            const output = parseLogOutput(consoleSpy.log)

            expect(output.context).toEqual({ key: 'value' })
        })
    })

    describe('warn', () => {
        it('should output JSON with warn level to console.warn', () => {
            logger.warn('warning message')
            const output = parseLogOutput(consoleSpy.warn)

            expect(output.level).toBe('warn')
            expect(output.message).toBe('warning message')
            expect(output.timestamp).toBeDefined()
        })

        it('should include context when provided', () => {
            logger.warn('warn context', { issue: 'something' })
            const output = parseLogOutput(consoleSpy.warn)

            expect(output.context).toEqual({ issue: 'something' })
        })
    })

    describe('error', () => {
        it('should output JSON with error level to console.error', () => {
            logger.error('error message')
            const output = parseLogOutput(consoleSpy.error)

            expect(output.level).toBe('error')
            expect(output.message).toBe('error message')
            expect(output.timestamp).toBeDefined()
        })

        it('should include context when provided', () => {
            logger.error('error context', { stack: 'trace' })
            const output = parseLogOutput(consoleSpy.error)

            expect(output.context).toEqual({ stack: 'trace' })
        })
    })

    describe('timestamp format', () => {
        it('should output a valid ISO 8601 timestamp', () => {
            logger.info('timestamp test')
            const output = parseLogOutput(consoleSpy.log)
            const parsed = new Date(output.timestamp as string)

            expect(parsed.getTime()).not.toBeNaN()
        })
    })
})
