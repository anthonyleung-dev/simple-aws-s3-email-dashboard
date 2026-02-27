// S3 client singleton with lazy initialization from environment variables.
// Validates required AWS config on first access and reuses the client instance.

import { S3Client } from '@aws-sdk/client-s3'

import logger from '@/lib/logger/logger'
import { AppError } from '@/lib/errors/appError'

let s3ClientInstance: S3Client | null = null

// Required environment variable names for S3 client configuration
const REQUIRED_ENV_VARS = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'] as const

// Validate that all required environment variables are present
function validateEnvVars(): void {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

    if (missing.length > 0) {
        throw new AppError({
            code: 'S3_CONFIG_MISSING',
            message: `Missing required environment variables: ${missing.join(', ')}`,
            functionName: 'validateEnvVars',
            inputs: { missing },
            statusCode: 500,
        })
    }
}

// Get or create the singleton S3Client instance
export function getS3Client(): S3Client {
    try {
        if (s3ClientInstance) {
            return s3ClientInstance
        }

        validateEnvVars()

        logger.info('Initializing S3 client', {
            region: process.env.AWS_REGION,
            bucket: process.env.S3_BUCKET_NAME,
        })

        s3ClientInstance = new S3Client({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        })

        return s3ClientInstance
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_CLIENT_INIT_FAILED',
            message: error instanceof Error ? error.message : 'Failed to initialize S3 client',
            functionName: 'getS3Client',
            statusCode: 500,
        })
    }
}

// Read S3 bucket name and key prefix from environment variables
export function getS3Config(): { bucket: string; prefix: string } {
    try {
        validateEnvVars()

        return {
            bucket: process.env.S3_BUCKET_NAME!,
            prefix: process.env.S3_PREFIX ?? '',
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_CONFIG_READ_FAILED',
            message: error instanceof Error ? error.message : 'Failed to read S3 configuration',
            functionName: 'getS3Config',
            statusCode: 500,
        })
    }
}
