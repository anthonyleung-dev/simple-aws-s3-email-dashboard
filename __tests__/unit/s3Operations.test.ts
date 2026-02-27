// Unit tests for S3 operations using aws-sdk-client-mock
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import { Readable } from 'stream'
import { sdkStreamMixin } from '@smithy/util-stream'

// Create the mock before importing the module under test
const mockS3 = mockClient(S3Client)

// Mock the s3Client singleton module so operations use our mocked client
jest.mock('@/lib/s3/s3Client', () => ({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    getS3Client: () => new (require('@aws-sdk/client-s3').S3Client)({}),
    getS3Config: () => ({
        bucket: 'test-bucket',
        prefix: 'emails/',
    }),
}))

// Suppress logger output during tests
jest.mock('@/lib/logger/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}))

import { listObjects, getObject, getObjectPartial, deleteObject, headObject } from '@/lib/s3/s3Operations'

// Helper to create a readable stream that aws-sdk mock can use for Body
function createSdkStream(content: string) {
    const stream = new Readable()
    stream.push(content)
    stream.push(null)
    return sdkStreamMixin(stream)
}

describe('s3Operations', () => {
    beforeAll(() => {
        process.env.AWS_REGION = 'us-east-1'
        process.env.AWS_ACCESS_KEY_ID = 'test-key'
        process.env.AWS_SECRET_ACCESS_KEY = 'test-secret'
        process.env.S3_BUCKET_NAME = 'test-bucket'
        process.env.S3_PREFIX = 'emails/'
    })

    beforeEach(() => {
        mockS3.reset()
    })

    describe('listObjects', () => {
        it('should return objects with keys, sizes, and lastModified', async () => {
            const now = new Date()
            mockS3.on(ListObjectsV2Command).resolves({
                Contents: [
                    { Key: 'emails/msg1', Size: 1024, LastModified: now },
                    { Key: 'emails/msg2', Size: 2048, LastModified: now },
                ],
                IsTruncated: false,
            })

            const result = await listObjects({ pageSize: 10 })

            expect(result.objects).toHaveLength(2)
            expect(result.objects[0]).toEqual({
                key: 'emails/msg1',
                size: 1024,
                lastModified: now,
            })
            expect(result.objects[1]).toEqual({
                key: 'emails/msg2',
                size: 2048,
                lastModified: now,
            })
            expect(result.hasMore).toBe(false)
            expect(result.nextCursor).toBeUndefined()
        })

        it('should support pagination with ContinuationToken', async () => {
            mockS3.on(ListObjectsV2Command).resolves({
                Contents: [{ Key: 'emails/msg3', Size: 512, LastModified: new Date() }],
                IsTruncated: true,
                NextContinuationToken: 'next-token-abc',
            })

            const result = await listObjects({ pageSize: 1, cursor: 'prev-token' })

            expect(result.hasMore).toBe(true)
            expect(result.nextCursor).toBe('next-token-abc')

            // Verify the cursor was passed in the command
            const call = mockS3.commandCalls(ListObjectsV2Command)[0]
            expect(call.args[0].input.ContinuationToken).toBe('prev-token')
        })

        it('should clamp pageSize to a maximum of 100', async () => {
            mockS3.on(ListObjectsV2Command).resolves({
                Contents: [],
                IsTruncated: false,
            })

            await listObjects({ pageSize: 200 })

            const call = mockS3.commandCalls(ListObjectsV2Command)[0]
            expect(call.args[0].input.MaxKeys).toBe(100)
        })

        it('should use default pageSize of 50 when not provided', async () => {
            mockS3.on(ListObjectsV2Command).resolves({
                Contents: [],
                IsTruncated: false,
            })

            await listObjects({})

            const call = mockS3.commandCalls(ListObjectsV2Command)[0]
            expect(call.args[0].input.MaxKeys).toBe(50)
        })

        it('should return empty array when Contents is undefined', async () => {
            mockS3.on(ListObjectsV2Command).resolves({
                IsTruncated: false,
            })

            const result = await listObjects({})

            expect(result.objects).toEqual([])
            expect(result.hasMore).toBe(false)
        })
    })

    describe('getObject', () => {
        it('should return body string and size', async () => {
            const body = createSdkStream('Hello email content')

            mockS3.on(GetObjectCommand).resolves({
                Body: body,
                ContentType: 'message/rfc822',
            })

            const result = await getObject('emails/msg1')

            expect(result.body).toBe('Hello email content')
            expect(result.size).toBe('Hello email content'.length)
            expect(result.contentType).toBe('message/rfc822')
        })
    })

    describe('getObjectPartial', () => {
        it('should send Range header and return partial body', async () => {
            const body = createSdkStream('partial content')

            mockS3.on(GetObjectCommand).resolves({
                Body: body,
            })

            const result = await getObjectPartial('emails/msg1', 1024)

            expect(result).toBe('partial content')

            // Verify Range header was sent
            const call = mockS3.commandCalls(GetObjectCommand)[0]
            expect(call.args[0].input.Range).toBe('bytes=0-1023')
        })
    })

    describe('deleteObject', () => {
        it('should call DeleteObjectCommand and complete without error', async () => {
            mockS3.on(DeleteObjectCommand).resolves({})

            await expect(deleteObject('emails/msg1')).resolves.toBeUndefined()

            const calls = mockS3.commandCalls(DeleteObjectCommand)
            expect(calls).toHaveLength(1)
            expect(calls[0].args[0].input.Key).toBe('emails/msg1')
            expect(calls[0].args[0].input.Bucket).toBe('test-bucket')
        })
    })

    describe('headObject', () => {
        it('should return size, lastModified, and contentType', async () => {
            const lastModified = new Date('2026-01-15T10:00:00Z')

            mockS3.on(HeadObjectCommand).resolves({
                ContentLength: 4096,
                LastModified: lastModified,
                ContentType: 'message/rfc822',
            })

            const result = await headObject('emails/msg1')

            expect(result.size).toBe(4096)
            expect(result.lastModified).toEqual(lastModified)
            expect(result.contentType).toBe('message/rfc822')
        })

        it('should default size to 0 when ContentLength is undefined', async () => {
            mockS3.on(HeadObjectCommand).resolves({
                ContentType: 'text/plain',
            })

            const result = await headObject('emails/msg1')

            expect(result.size).toBe(0)
        })
    })
})
