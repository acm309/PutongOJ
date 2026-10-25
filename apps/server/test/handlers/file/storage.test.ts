import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- AVA uses Node's built-in method mocks.
import { mock } from 'node:test'
import { Files, mongoose } from '@putong-oj/db'
import { ErrorCode } from '@putong-oj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app.ts'
import { encryptData } from '../../../src/services/crypto.ts'
import { uploadStorage } from '../../../src/storage/index.ts'
import { UploadTimeoutError } from '../../../src/storage/types.ts'
import { deploy } from '../../../src/utils/constants.ts'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFioAAAAASUVORK5CYII=', 'base64')
const server = app.listen()
const request = supertest.agent(server)
const keys = new Set<string>()

test.before(async (t) => {
  const res = await request.post('/api/account/login').send({
    username: 'admin', password: await encryptData(deploy.adminInitPwd),
  })
  t.true(res.body.success)
})

test.after.always(async () => {
  for (const key of keys) {
    await uploadStorage.remove(key)
    await Files.deleteOne({ storageKey: key })
  }
  server.close()
})

async function upload (bytes = png, filename = 'pixel.png') {
  const res = await request.post('/api/upload').attach('image', bytes, { filename })
  if (res.body.data?.storageKey) {
    keys.add(res.body.data.storageKey)
  }
  return res
}

test.serial('An upload is public at its original URL, supports HEAD and conditional GET', async (t) => {
  const uploaded = await upload()
  t.true(uploaded.body.success)
  const { url, storageKey } = uploaded.body.data
  t.is(url, `/uploads/${storageKey}`)
  const get = await supertest(server).get(url)
  t.is(get.status, 200)
  t.is(get.type, 'image/png')
  t.is(get.headers['cache-control'], 'max-age=604')
  t.deepEqual(get.body, png)
  const head = await supertest(server).head(url)
  t.is(head.status, 200)
  t.is(Number(head.headers['content-length']), png.length)
  const read = mock.method(uploadStorage, 'get', async () => { throw new Error('304 must not read the object body') })
  t.teardown(() => read.mock.restore())
  const cached = await supertest(server).get(url).set('If-None-Match', get.headers.etag)
  t.is(cached.status, 304)
  t.is((await supertest(server).get(url).set('If-Modified-Since', head.headers['last-modified'])).status, 304)
  t.is(read.mock.callCount(), 0)
  read.mock.restore()
  t.is((await supertest(server).get(url).set('If-None-Match', '"stale"')).status, 200)
  const removed = await request.delete(`/api/files/${storageKey}`)
  t.true(removed.body.success)
  t.is((await supertest(server).get(url)).status, 404)
})

test.serial('Storage failures return an uncacheable HTTP 503 and a request ID', async (t) => {
  const uploaded = await upload()
  const { url } = uploaded.body.data
  for (const method of [ 'get', 'head' ] as const) {
    const stub = mock.method(uploadStorage, method, async () => { throw new Error('Storage denied') })
    try {
      const res = await supertest(server)[method](url)
      t.is(res.status, 503)
      t.is(res.headers['cache-control'], 'no-store')
      t.truthy(res.headers['x-request-id'])
      t.falsy(res.headers.etag)
    } finally {
      stub.mock.restore()
    }
  }
  const head = await supertest(server).head(url)
  const get = mock.method(uploadStorage, 'get', async () => { throw new Error('GET failed after HEAD') })
  t.teardown(() => get.mock.restore())
  const res = await supertest(server).get(url).set('If-None-Match', '"stale"').set('X-Request-ID', 'storage-failure-test')
  t.is(res.status, 503)
  t.is(res.headers['x-request-id'], 'storage-failure-test')
  t.is(res.headers['cache-control'], 'no-store')
  t.not(res.headers['content-length'], head.headers['content-length'])
  t.falsy(res.headers.etag)
  t.falsy(res.headers['last-modified'])
})

test.serial('Concurrent conditional writes preserve exactly one complete object', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ptoj-conflict-test-'))
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const first = path.join(directory, 'first')
  const second = path.join(directory, 'second')
  await writeFile(first, 'first complete object')
  await writeFile(second, 'second complete object')
  const key = `concurrent-${randomUUID()}`
  keys.add(key)
  const results = await Promise.allSettled([
    uploadStorage.putFile(key, first, 'application/octet-stream'),
    uploadStorage.putFile(key, second, 'application/octet-stream'),
  ])
  t.is(results.filter(result => result.status === 'fulfilled').length, 1)
  async function readBytes () {
    const file = (await uploadStorage.get(key))!
    const chunks: Buffer[] = []
    for await (const chunk of file.body) chunks.push(Buffer.from(chunk))
    return Buffer.concat(chunks).toString()
  }
  const expected = results[0].status === 'fulfilled' ? 'first complete object' : 'second complete object'
  t.is(await readBytes(), expected)
  await t.throwsAsync(uploadStorage.putFile(key, results[0].status === 'fulfilled' ? second : first, 'application/octet-stream'))
  t.is(await readBytes(), expected)
})

test.serial('A timeout gives the editor a retry message without registering a file', async (t) => {
  const put = mock.method(uploadStorage, 'putFile', async () => { throw new UploadTimeoutError() })
  t.teardown(() => put.mock.restore())
  const res = await upload()
  t.false(res.body.success)
  t.is(res.body.code, ErrorCode.UploadTimeout)
  t.regex(res.body.message, /timed out.*uploading again/)
  t.truthy(res.headers['x-request-id'])
})

test.serial('Request IDs accept bounded tokens and replace arbitrary client strings', async (t) => {
  const url = `/uploads/${randomUUID()}`
  for (const value of [ 'a'.repeat(129), 'spaces and punctuation!', 'audit=value' ]) {
    const res = await supertest(server).get(url).set('X-Request-ID', value)
    t.not(res.headers['x-request-id'], value)
    t.regex(res.headers['x-request-id'], /^[0-9a-f-]{36}$/)
  }
  const accepted = `${'a'.repeat(126)}_-`
  const res = await supertest(server).get(url).set('X-Request-ID', accepted)
  t.is(res.headers['x-request-id'], accepted)
})

test.serial('Missing and malformed uploads never fall through to SPA or static files', async (t) => {
  t.is((await supertest(server).get(`/uploads/${randomUUID()}`)).status, 404)
  t.is((await supertest(server).get('/uploads/%2Fsecret')).status, 400)
  t.is((await supertest(server).post('/uploads/anything')).status, 405)
})

test.serial('Legacy keys without database records work and existing bytes cannot be overwritten', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ptoj-legacy-test-'))
  t.teardown(() => rm(directory, { recursive: true, force: true }))
  const source = path.join(directory, 'pixel.png')
  const key = `legacy-${randomUUID()}.png`
  keys.add(key)
  await writeFile(source, png)
  await uploadStorage.putFile(key, source, 'image/png')
  t.falsy(await Files.exists({ storageKey: key }))
  await t.throwsAsync(uploadStorage.putFile(key, source, 'image/png'))
  t.deepEqual((await supertest(server).get(`/uploads/${key}`)).body, png)
})

test.serial('Storage upload failure does not register a file', async (t) => {
  let key = ''
  const stub = mock.method(uploadStorage, 'putFile', async (incoming: string) => {
    key = incoming
    throw new Error('Storage unavailable')
  })
  t.teardown(() => stub.mock.restore())
  const res = await upload()
  t.false(res.body.success)
  t.falsy(await Files.exists({ storageKey: key }))
})

test.serial('A lost storage acknowledgement preserves the object without registering a file', async (t) => {
  let key = ''
  const originalPut = uploadStorage.putFile.bind(uploadStorage)
  const put = mock.method(uploadStorage, 'putFile', async (incoming: string, source: string, type: string) => {
    key = incoming
    keys.add(key)
    await originalPut(incoming, source, type)
    throw new Error('Storage acknowledgement lost')
  })
  t.teardown(() => put.mock.restore())
  t.false((await upload()).body.success)
  t.falsy(await Files.exists({ storageKey: key }))
  t.truthy(await uploadStorage.head(key))
})

test.serial('A definite registration rejection cleans up its new object', async (t) => {
  let key = ''
  const originalPut = uploadStorage.putFile.bind(uploadStorage)
  const put = mock.method(uploadStorage, 'putFile', async (incoming: string, source: string, type: string) => {
    key = incoming
    await originalPut(incoming, source, type)
  })
  const save = mock.method(Files.prototype, 'save', async () => { throw new mongoose.Error.ValidationError() })
  t.teardown(() => { put.mock.restore(); save.mock.restore() })
  t.false((await upload()).body.success)
  t.is(await uploadStorage.head(key), null)
  t.falsy(await Files.exists({ storageKey: key }))
})

test.serial('A lost Mongo acknowledgement does not delete an already registered object', async (t) => {
  let key = ''
  const originalSave = Files.prototype.save
  const save = mock.method(Files.prototype, 'save', async function (this: any) {
    await originalSave.call(this)
    key = this.storageKey
    keys.add(key)
    throw new Error('Mongo acknowledgement lost')
  })
  t.teardown(() => save.mock.restore())
  t.false((await upload()).body.success)
  t.truthy(await Files.exists({ storageKey: key }))
  t.truthy(await uploadStorage.head(key))
  t.deepEqual((await supertest(server).get(`/uploads/${key}`)).body, png)
})

test.serial('Physical deletion failure leaves an active file and a retry succeeds', async (t) => {
  const uploaded = await upload()
  t.true(uploaded.body.success)
  const { storageKey, url } = uploaded.body.data
  const stub = mock.method(uploadStorage, 'remove', async () => { throw new Error('Deletion unavailable') })
  t.teardown(() => stub.mock.restore())
  t.false((await request.delete(`/api/files/${storageKey}`)).body.success)
  t.falsy((await Files.findOne({ storageKey }).lean())!.deletedAt)
  t.is((await supertest(server).get(url)).status, 200)
  stub.mock.restore()
  t.true((await request.delete(`/api/files/${storageKey}`)).body.success)
  t.is((await supertest(server).get(url)).status, 404)
})

test.serial('A failed deletion marker can be retried after the object was removed', async (t) => {
  const uploaded = await upload()
  t.true(uploaded.body.success)
  const { storageKey } = uploaded.body.data
  const save = mock.method(Files.prototype, 'save', async () => { throw new Error('Mongo unavailable') })
  t.teardown(() => save.mock.restore())
  t.false((await request.delete(`/api/files/${storageKey}`)).body.success)
  t.is(await uploadStorage.head(storageKey), null)
  t.falsy((await Files.findOne({ storageKey }).lean())!.deletedAt)
  save.mock.restore()
  t.true((await request.delete(`/api/files/${storageKey}`)).body.success)
  t.truthy((await Files.findOne({ storageKey }).lean())!.deletedAt)
})

for (const committed of [ false, true ]) {
  test.serial(`Deletion recovers from a lost Mongo acknowledgement (committed=${committed})`, async (t) => {
    const uploaded = await upload()
    const { storageKey } = uploaded.body.data
    const originalSave = Files.prototype.save
    let calls = 0
    const save = mock.method(Files.prototype, 'save', async function (this: any) {
      calls++
      if (calls === 1) {
        if (committed) await originalSave.call(this)
        throw new Error('Mongo acknowledgement lost')
      }
      return await originalSave.call(this)
    })
    t.teardown(() => save.mock.restore())
    t.true((await request.delete(`/api/files/${storageKey}`)).body.success)
    t.is(calls, committed ? 1 : 2)
    t.truthy((await Files.findOne({ storageKey }).lean())!.deletedAt)
    t.is(await uploadStorage.head(storageKey), null)
  })
}

test.serial('The server accepts editor uploads above 4 MiB and rejects files above 5 MiB', async (t) => {
  const accepted = Buffer.alloc(4 * 1024 * 1024 + 1)
  png.copy(accepted)
  const uploaded = await upload(accepted)
  t.true(uploaded.body.success)
  t.is((await uploadStorage.head(uploaded.body.data.storageKey))!.sizeBytes, accepted.length)
  const rejected = await upload(Buffer.alloc(5 * 1024 * 1024 + 1))
  t.false(rejected.body.success)
})

test.serial('Browser-provided MIME and filename cannot make active content render inline', async (t) => {
  const uploaded = await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image.png')
  t.true(uploaded.body.success)
  const downloaded = await supertest(server).get(uploaded.body.data.url)
  t.is(downloaded.type, 'application/octet-stream')
  t.is(downloaded.headers['content-disposition'], 'attachment')
  t.is(downloaded.headers['x-content-type-options'], 'nosniff')
})
