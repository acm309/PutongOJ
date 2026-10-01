import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- AVA uses Node's built-in method mocks.
import { mock } from 'node:test'
import { Files, mongoose } from '@putong-oj/db'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app.ts'
import { encryptData } from '../../../src/services/crypto.ts'
import { uploadStorage } from '../../../src/storage/index.ts'
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
  const cached = await supertest(server).get(url).set('If-None-Match', get.headers.etag)
  t.is(cached.status, 304)
  const removed = await request.delete(`/api/files/${storageKey}`)
  t.true(removed.body.success)
  t.is((await supertest(server).get(url)).status, 404)
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
