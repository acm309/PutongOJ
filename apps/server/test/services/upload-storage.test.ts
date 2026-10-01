import { Buffer } from 'node:buffer'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- AVA uses Node's built-in method mocks.
import { mock } from 'node:test'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import test from 'ava'
import { loadUploadStorageConfig } from '../../src/storage/config.ts'
import { LocalUploadStorage } from '../../src/storage/local.ts'
import { S3UploadStorage } from '../../src/storage/s3.ts'

test('Local storage preserves bytes, refuses overwrite and rejects traversal', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ptoj-storage-test-'))
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const source = path.join(directory, 'source')
  const bytes = Buffer.from('test bytes')
  await writeFile(source, bytes)
  const storage = new LocalUploadStorage(path.join(directory, 'uploads'))
  await storage.putFile('example', source)
  await t.throwsAsync(storage.putFile('example', source))
  await t.throwsAsync(storage.get('../source'))
  await t.throwsAsync(storage.putFile('..\\source', source))
  const file = await storage.get('example')
  t.truthy(file)
  t.is(file!.sizeBytes, bytes.length)
  const received: Buffer[] = []
  for await (const part of file!.body) {
    received.push(Buffer.from(part))
  }
  t.deepEqual(Buffer.concat(received), bytes)
  await storage.remove('example')
  await storage.remove('example')
  t.is(await storage.get('example'), null)
})

test('S3 configuration fails explicitly instead of silently falling back to local', (t) => {
  t.is(loadUploadStorageConfig({}).driver, 'local')
  t.throws(() => loadUploadStorageConfig({ PTOJ_UPLOAD_STORAGE: 'typo' }))
  t.throws(() => loadUploadStorageConfig({ PTOJ_UPLOAD_STORAGE: 's3' }), { message: /PTOJ_S3_ENDPOINT/ })
})

test('S3 access failures and missing buckets are not returned as missing files', async (t) => {
  const storage = new S3UploadStorage({
    driver: 's3', endpoint: 'http://127.0.0.1:1', region: 'us-east-1',
    bucket: 'test', prefix: 'uploads', accessKeyId: 'test', secretAccessKey: 'test', forcePathStyle: true,
  })
  t.teardown(() => storage.client.destroy())
  const denied = Object.assign(new Error('Access denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })
  const stub = mock.method(storage.client, 'send', async () => { throw denied })
  t.teardown(() => stub.mock.restore())
  t.is(await t.throwsAsync(storage.get('key')), denied)
  t.is(await t.throwsAsync(storage.head('key')), denied)
  const missingBucket = Object.assign(new Error('Bucket missing'), { name: 'NoSuchBucket', $metadata: { httpStatusCode: 404 } })
  stub.mock.mockImplementation(async () => { throw missingBucket })
  t.is(await t.throwsAsync(storage.get('key')), missingBucket)
  t.is(await t.throwsAsync(storage.head('key')), missingBucket)
  const missingHead = Object.assign(new Error('Not found'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } })
  stub.mock.mockImplementation(async (command: unknown) => {
    if (command instanceof HeadBucketCommand) {
      throw missingBucket
    }
    throw missingHead
  })
  t.is(await t.throwsAsync(storage.head('key')), missingBucket)
  stub.mock.mockImplementation(async (command: unknown) => {
    if (command instanceof HeadBucketCommand) {
      return {}
    }
    throw missingHead
  })
  t.is(await storage.head('key'), null)
})
