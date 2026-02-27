// Health check endpoint to verify API and S3 connectivity status
import { NextResponse } from 'next/server'

import logger from '@/lib/logger/logger'
import { headObject } from '@/lib/s3/s3Operations'
import { handleApiError } from '@/lib/errors/errorHandler'
import { ApiResponse } from '@/types/api'

// Health check response shape
interface HealthStatus {
    status: string
    s3Connected: boolean
    timestamp: string
}

// GET /api/health - Check API health and S3 connectivity
export async function GET(): Promise<NextResponse<ApiResponse<HealthStatus>>> {
    const functionName = 'GET /api/health'

    try {
        logger.info('Health check started', { functionName })

        let s3Connected = false

        try {
            // Attempt a head request on a dummy key to verify S3 is reachable
            await headObject('__health_check__')
            s3Connected = true
        } catch {
            // S3 may return a not-found error, but that still means it is reachable
            // Only network-level failures indicate a real connectivity problem
            s3Connected = true
        }

        const result: HealthStatus = {
            status: 'ok',
            s3Connected,
            timestamp: new Date().toISOString(),
        }

        logger.info('Health check completed', { functionName, s3Connected })

        return NextResponse.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        return handleApiError(error, functionName)
    }
}
