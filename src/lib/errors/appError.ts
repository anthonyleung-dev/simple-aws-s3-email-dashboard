// Custom application error with structured context for tracing and debugging.
// Carries error code, originating function name, and optional input snapshot.

export class AppError extends Error {
    public readonly code: string
    public readonly functionName: string
    public readonly inputs?: Record<string, unknown>
    public readonly statusCode: number

    constructor(params: {
        code: string
        message: string
        functionName: string
        inputs?: Record<string, unknown>
        statusCode?: number
    }) {
        super(params.message)
        this.name = 'AppError'
        this.code = params.code
        this.functionName = params.functionName
        this.inputs = params.inputs
        this.statusCode = params.statusCode ?? 500
    }
}
