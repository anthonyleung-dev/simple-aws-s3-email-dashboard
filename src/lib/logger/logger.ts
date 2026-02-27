// Structured JSON logger for consistent server-side log output.
// All log entries include ISO timestamp, level, message, and optional context.

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: Record<string, unknown>
}

// Build a structured log entry with timestamp and level
function createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    }

    if (context !== undefined) {
        entry.context = context
    }

    return entry
}

// Log a debug-level message to stdout
export function debug(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('debug', message, context)
    console.log(JSON.stringify(entry))
}

// Log an info-level message to stdout
export function info(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('info', message, context)
    console.log(JSON.stringify(entry))
}

// Log a warn-level message to stderr via console.warn
export function warn(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('warn', message, context)
    console.warn(JSON.stringify(entry))
}

// Log an error-level message to stderr via console.error
export function error(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry('error', message, context)
    console.error(JSON.stringify(entry))
}

const logger = { debug, info, warn, error }

export default logger
