import type { Readable } from 'node:stream'
import type { UploadStorageConfig } from './config.ts'
import type { StoredFile, StoredFileInfo, UploadStorage } from './types.ts'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { assertUploadKey } from './types.ts'

export class S3UploadStorage implements UploadStorage {
  readonly client: S3Client
  private readonly config: Extract<UploadStorageConfig, { driver: 's3' }>

  constructor (config: Extract<UploadStorageConfig, { driver: 's3' }>) {
    this.config = config
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      maxAttempts: 3,
      requestHandler: { connectionTimeout: 3000, requestTimeout: 10000 },
    })
  }

  private object (key: string) {
    assertUploadKey(key)
    return { Bucket: this.config.bucket, Key: [ this.config.prefix, key ].filter(Boolean).join('/') }
  }

  private missing (err: any): boolean {
    return err.name === 'NoSuchKey' || (err.name === 'NotFound' && err.$metadata?.httpStatusCode === 404)
  }

  async putFile (key: string, filepath: string, contentType: string): Promise<void> {
    const info = await stat(filepath)
    const body = createReadStream(filepath)
    try {
      await this.client.send(new PutObjectCommand({
        ...this.object(key),
        Body: body,
        ContentLength: info.size,
        ContentType: contentType,
        IfNoneMatch: '*',
      }))
    } finally {
      body.destroy()
    }
  }

  async get (key: string): Promise<StoredFile | null> {
    try {
      const result = await this.client.send(new GetObjectCommand(this.object(key)))
      if (!result.Body) {
        throw new Error('S3 returned an object without a body')
      }
      return {
        body: result.Body as Readable,
        sizeBytes: result.ContentLength ?? 0,
        contentType: result.ContentType || 'application/octet-stream',
        etag: result.ETag,
        lastModified: result.LastModified,
      }
    } catch (err) {
      if (this.missing(err)) {
        return null
      }
      throw err
    }
  }

  async head (key: string): Promise<StoredFileInfo | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand(this.object(key)))
      return {
        sizeBytes: result.ContentLength ?? 0,
        contentType: result.ContentType || 'application/octet-stream',
        etag: result.ETag,
        lastModified: result.LastModified,
      }
    } catch (err) {
      if (this.missing(err)) {
        // HEAD has no error body: a missing bucket can also return NotFound.
        await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }))
        return null
      }
      throw err
    }
  }

  async remove (key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand(this.object(key)))
  }
}
