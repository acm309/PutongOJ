import { Buffer } from 'node:buffer'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- AVA uses Node's built-in method mocks.
import { mock } from 'node:test'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import test from 'ava'
import { loadUploadStorageConfig } from '../../src/storage/config.ts'
import { LocalUploadStorage } from '../../src/storage/local.ts'
import { S3UploadStorage } from '../../src/storage/s3.ts'
import { UploadTimeoutError } from '../../src/storage/types.ts'

const s3Config = {
  driver: 's3' as const, endpoint: 'http://127.0.0.1:1', region: 'us-east-1',
  bucket: 'test', prefix: 'uploads', accessKeyId: 'test', secretAccessKey: 'test', forcePathStyle: true,
  connectionTimeoutMs: 3000, uploadTimeoutMs: 10000, readTimeoutMs: 5000,
}

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
  const storage = new S3UploadStorage(s3Config)
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

test('S3 timeouts have defaults and reject invalid configuration', (t) => {
  const env = {
    PTOJ_UPLOAD_STORAGE: 's3', PTOJ_S3_ENDPOINT: s3Config.endpoint,
    PTOJ_S3_BUCKET: 'test', PTOJ_S3_ACCESS_KEY_ID: 'test', PTOJ_S3_SECRET_ACCESS_KEY: 'test',
  }
  const config = loadUploadStorageConfig(env)
  t.like(config, { connectionTimeoutMs: 3000, uploadTimeoutMs: 10000, readTimeoutMs: 5000 })
  t.like(loadUploadStorageConfig({ ...env, PTOJ_S3_UPLOAD_TIMEOUT_MS: '25000' }), { uploadTimeoutMs: 25000 })
  for (const value of [ '0', '-1', '1.5', '10s', 'NaN', '2147483648' ]) {
    t.throws(() => loadUploadStorageConfig({ ...env, PTOJ_S3_UPLOAD_TIMEOUT_MS: value }))
    t.throws(() => loadUploadStorageConfig({ ...env, PTOJ_S3_READ_TIMEOUT_MS: value }))
  }
})

test('Large streaming PUT does not wait for a proxy to send 100 Continue', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ptoj-large-upload-'))
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const source = path.join(directory, 'source')
  const size = 4.5 * 1024 * 1024
  await writeFile(source, Buffer.alloc(size, 1))
  let expect: string | undefined
  let receivedBytes = 0
  const server = createServer(async (req, res) => {
    expect = req.headers.expect
    for await (const chunk of req) receivedBytes += chunk.length
    res.end()
  })
  // A proxy that neither sends 100 Continue nor reads the body on this path.
  server.on('checkContinue', (req) => { expect = req.headers.expect })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => { server.closeAllConnections(); server.close() })
  const address = server.address() as { port: number }
  const storage = new S3UploadStorage({ ...s3Config, endpoint: `http://127.0.0.1:${address.port}`, uploadTimeoutMs: 2000 })
  t.teardown(() => storage.client.destroy())
  await t.notThrowsAsync(storage.putFile('key', source, 'image/png'))
  t.is(expect, undefined)
  t.true(receivedBytes >= size)
})

for (const method of [ 'get', 'head' ] as const) {
  test(`S3 ${method} has a total wait limit even when the peer never replies`, async (t) => {
    let attempts = 0
    const server = createServer(() => { attempts++ })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    t.teardown(() => { server.closeAllConnections(); server.close() })
    const address = server.address() as { port: number }
    const storage = new S3UploadStorage({ ...s3Config, endpoint: `http://127.0.0.1:${address.port}`, readTimeoutMs: 200 })
    t.teardown(() => storage.client.destroy())
    const start = Date.now()
    await t.throwsAsync(storage[method]('key'))
    t.true(Date.now() - start < 1500)
    t.is(attempts, 1)
  })
}

test('S3 read deadline ends at response headers and does not cut off the body', async (t) => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Length': '4' })
    res.flushHeaders()
    const timer = setTimeout(() => res.end('slow'), 500)
    res.on('close', () => clearTimeout(timer))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => { server.closeAllConnections(); server.close() })
  const address = server.address() as { port: number }
  const storage = new S3UploadStorage({ ...s3Config, endpoint: `http://127.0.0.1:${address.port}`, readTimeoutMs: 200 })
  t.teardown(() => storage.client.destroy())
  const file = await storage.get('key')
  const chunks: Buffer[] = []
  for await (const chunk of file!.body) chunks.push(Buffer.from(chunk))
  t.is(Buffer.concat(chunks).toString(), 'slow')
})

test('S3 read deadline also bounds Retry-After backoff', async (t) => {
  let attempts = 0
  const server = createServer((req, res) => {
    attempts++
    res.writeHead(503, { 'Content-Type': 'application/xml', 'Retry-After': '1' })
    res.end('<Error><Code>SlowDown</Code><Message>retry later</Message></Error>')
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  t.teardown(() => { server.closeAllConnections(); server.close() })
  const address = server.address() as { port: number }
  const storage = new S3UploadStorage({ ...s3Config, endpoint: `http://127.0.0.1:${address.port}`, readTimeoutMs: 200 })
  t.teardown(() => storage.client.destroy())
  const start = Date.now()
  await t.throwsAsync(storage.get('key'))
  t.true(Date.now() - start < 800)
  t.is(attempts, 1)
})

for (const responseMode of [ 'silent', 'headers-only', 'disconnect', 'success' ] as const) {
  test(`Real SDK streaming PUT: ${responseMode}`, async (t) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'ptoj-timeout-test-'))
    t.teardown(() => rm(directory, { recursive: true, force: true }))
    const source = path.join(directory, 'source')
    await writeFile(source, Buffer.alloc(128 * 1024, 1))
    let attempts = 0
    let receivedBytes = 0
    const server = createServer(async (req, res) => {
      attempts++
      for await (const chunk of req) receivedBytes += chunk.length
      if (responseMode === 'disconnect') req.socket.destroy()
      if (responseMode === 'headers-only') {
        res.writeHead(200, { 'Content-Length': '20' })
        res.flushHeaders()
      }
      if (responseMode === 'success') res.end()
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    t.teardown(() => { server.closeAllConnections(); server.close() })
    const address = server.address() as { port: number }
    const storage = new S3UploadStorage({ ...s3Config, endpoint: `http://127.0.0.1:${address.port}`, uploadTimeoutMs: 250 })
    t.teardown(() => storage.client.destroy())
    const start = Date.now()
    const operation = storage.putFile('key', source, 'image/png')
    if (responseMode === 'success') await t.notThrowsAsync(operation)
    else if (responseMode === 'disconnect') await t.throwsAsync(operation)
    else await t.throwsAsync(operation, { instanceOf: UploadTimeoutError })
    t.true(Date.now() - start < 2000)
    t.is(attempts, 1)
    t.true(receivedBytes >= 128 * 1024)
  })
}
