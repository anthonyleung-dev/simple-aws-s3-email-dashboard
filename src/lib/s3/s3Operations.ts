// S3 operations wrapping AWS SDK commands with structured error handling.
// Provides list, get, partial get, delete, and head operations on the email bucket.

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

import logger from '@/lib/logger/logger'
import { AppError } from '@/lib/errors/appError'
import { getS3Client, getS3Config } from '@/lib/s3/s3Client'

// Metadata for a single S3 object returned from list operations
export interface S3Object {
    key: string
    size: number
    lastModified: Date
}

// Result shape for the listObjects operation with cursor-based pagination
interface ListObjectsResult {
    objects: S3Object[]
    nextCursor?: string
    hasMore: boolean
}

// Result shape for the getObject operation
interface GetObjectResult {
    body: string
    contentType?: string
    size: number
}

// Result shape for the headObject operation
interface HeadObjectResult {
    size: number
    lastModified: Date
    contentType?: string
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

// List objects in the email bucket with cursor-based pagination
export async function listObjects(params: { pageSize?: number; cursor?: string }): Promise<ListObjectsResult> {
    const functionName = 'listObjects'

    try {
        const client = getS3Client()
        const config = getS3Config()
        const pageSize = Math.min(Math.max(params.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)

        logger.info('Listing S3 objects', {
            functionName,
            bucket: config.bucket,
            prefix: config.prefix,
            pageSize,
            hasCursor: !!params.cursor,
        })

        const command = new ListObjectsV2Command({
            Bucket: config.bucket,
            Prefix: config.prefix,
            MaxKeys: pageSize,
            ContinuationToken: params.cursor,
        })

        const response = await client.send(command)

        const objects: S3Object[] = (response.Contents ?? []).map((item) => ({
            key: item.Key!,
            size: item.Size ?? 0,
            lastModified: item.LastModified ?? new Date(),
        }))

        logger.info('Listed S3 objects successfully', {
            functionName,
            count: objects.length,
            hasMore: response.IsTruncated ?? false,
        })

        return {
            objects,
            nextCursor: response.NextContinuationToken,
            hasMore: response.IsTruncated ?? false,
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_LIST_FAILED',
            message: error instanceof Error ? error.message : 'Failed to list S3 objects',
            functionName,
            inputs: { pageSize: params.pageSize, hasCursor: !!params.cursor },
            statusCode: 500,
        })
    }
}

// Retrieve the full content of an S3 object as a UTF-8 string
export async function getObject(key: string): Promise<GetObjectResult> {
    const functionName = 'getObject'

    try {
        const client = getS3Client()
        const config = getS3Config()

        logger.info('Getting S3 object', { functionName, key })

        const command = new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
        })

        const response = await client.send(command)
        const body = (await response.Body?.transformToString('utf-8')) ?? ''

        logger.info('Got S3 object successfully', {
            functionName,
            key,
            size: body.length,
        })

        return {
            body,
            contentType: response.ContentType,
            size: body.length,
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_GET_FAILED',
            message: error instanceof Error ? error.message : 'Failed to get S3 object',
            functionName,
            inputs: { key },
            statusCode: 500,
        })
    }
}

// Retrieve only the first N bytes of an S3 object (for header-only parsing)
export async function getObjectPartial(key: string, bytes: number): Promise<string> {
    const functionName = 'getObjectPartial'

    try {
        const client = getS3Client()
        const config = getS3Config()

        logger.info('Getting partial S3 object', { functionName, key, bytes })

        const command = new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
            Range: `bytes=0-${bytes - 1}`,
        })

        const response = await client.send(command)
        const body = (await response.Body?.transformToString('utf-8')) ?? ''

        logger.info('Got partial S3 object successfully', {
            functionName,
            key,
            requestedBytes: bytes,
            actualSize: body.length,
        })

        return body
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_GET_PARTIAL_FAILED',
            message: error instanceof Error ? error.message : 'Failed to get partial S3 object',
            functionName,
            inputs: { key, bytes },
            statusCode: 500,
        })
    }
}

// Delete a single object from the S3 bucket
export async function deleteObject(key: string): Promise<void> {
    const functionName = 'deleteObject'

    try {
        const client = getS3Client()
        const config = getS3Config()

        logger.info('Deleting S3 object', { functionName, key })

        const command = new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key,
        })

        await client.send(command)

        logger.info('Deleted S3 object successfully', { functionName, key })
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_DELETE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to delete S3 object',
            functionName,
            inputs: { key },
            statusCode: 500,
        })
    }
}

// Retrieve metadata (size, last modified, content type) for an S3 object without downloading it
export async function headObject(key: string): Promise<HeadObjectResult> {
    const functionName = 'headObject'

    try {
        const client = getS3Client()
        const config = getS3Config()

        logger.info('Head S3 object', { functionName, key })

        const command = new HeadObjectCommand({
            Bucket: config.bucket,
            Key: key,
        })

        const response = await client.send(command)

        logger.info('Head S3 object successful', {
            functionName,
            key,
            size: response.ContentLength,
        })

        return {
            size: response.ContentLength ?? 0,
            lastModified: response.LastModified ?? new Date(),
            contentType: response.ContentType,
        }
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }

        throw new AppError({
            code: 'S3_HEAD_FAILED',
            message: error instanceof Error ? error.message : 'Failed to head S3 object',
            functionName,
            inputs: { key },
            statusCode: 500,
        })
    }
}
