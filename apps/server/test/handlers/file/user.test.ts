import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { resolve } from 'node:path'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import Files from '../../../src/models/Files'
import User from '../../../src/models/User'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)
const otherRequest = supertest.agent(server)

const filepath = resolve(__dirname, '../utils.test.ts')
const content = fs.readFileSync(filepath, 'utf8')

let uploadedStorageKey: string | null = null

test.before('Set storage quota and login as primary user', async (t) => {
  const user = await User.findOne({ uid: 'primaryuser' })
  t.truthy(user)
  user!.storageQuota = 2 * 1024 * 1024
  await user!.save()

  const login = await request
    .post('/api/account/login')
    .send({
      username: 'primaryuser',
      password: await encryptData(userSeeds.primaryuser.pwd!),
    })
  t.is(login.status, 200)
  t.true(login.body.success)
})

test.before('Login as admin for other-user scenario', async (t) => {
  const login = await otherRequest
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })
  t.is(login.status, 200)
  t.true(login.body.success)
})

// ─── Upload ────────────────────────────────────────────────────────────────

test.serial('Upload fails when no file is attached', async (t) => {
  const res = await request
    .post('/api/upload')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.serial('Upload fails when storage quota is 0', async (t) => {
  const user = await User.findOne({ uid: 'primaryuser' })
  t.truthy(user)
  user!.storageQuota = 0
  await user!.save()

  const res = await request
    .post('/api/upload')
    .attach('image', filepath)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)

  // Restore quota
  user!.storageQuota = 2 * 1024 * 1024
  await user!.save()
})

test.serial('Upload succeeds with sufficient storage quota', async (t) => {
  const res = await request
    .post('/api/upload')
    .attach('image', filepath)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(typeof res.body.data.url, 'string')
  t.is(typeof res.body.data.storageKey, 'string')
  t.is(typeof res.body.data.sizeBytes, 'number')

  uploadedStorageKey = res.body.data.storageKey

  const record = await Files.findOne({ storageKey: uploadedStorageKey }).lean()
  t.truthy(record)
  t.is(record!.sizeBytes, Buffer.byteLength(content, 'utf8'))
})

// ─── List files ────────────────────────────────────────────────────────────

test.serial('List files returns user\'s uploaded files', async (t) => {
  const res = await request
    .get('/api/files')

  t.is(res.status, 200)
  t.true(res.body.success)

  const { files, usage } = res.body.data
  t.truthy(files)
  t.true(Array.isArray(files.docs))
  t.true(files.docs.length > 0)

  const uploaded = files.docs.find((f: any) => f.storageKey === uploadedStorageKey)
  t.truthy(uploaded)
  t.is(uploaded.storageKey, uploadedStorageKey)
  t.is(typeof uploaded.sizeBytes, 'number')

  t.truthy(usage)
  t.is(typeof usage.usedBytes, 'number')
  t.is(typeof usage.storageQuota, 'number')
  t.true(usage.usedBytes > 0)
})

test.serial('List files supports pagination', async (t) => {
  const res = await request
    .get('/api/files?pageSize=1')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.files.docs.length, 1)
  t.is(res.body.data.files.limit, 1)
})

test.serial('List files fails with invalid query parameters', async (t) => {
  const res = await request
    .get('/api/files?page=invalid')

  t.is(res.status, 200)
  t.is(res.body.success, false)
})

// ─── Delete ────────────────────────────────────────────────────────────────

test.serial('Delete fails for non-existent storage key', async (t) => {
  const res = await request
    .delete('/api/files/____nonexistent____')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.serial('Delete fails when another user tries to delete the file', async (t) => {
  t.truthy(uploadedStorageKey)

  // Upload a file as admin so primaryUser tries to delete admin's file
  const adminUpload = await otherRequest
    .post('/api/upload')
    .attach('image', filepath)
  t.is(adminUpload.status, 200)
  t.true(adminUpload.body.success)
  const adminStorageKey = adminUpload.body.data.storageKey

  // primaryUser tries to delete admin's file - should be forbidden
  const res = await request
    .delete(`/api/files/${adminStorageKey}`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test.serial('Delete own file succeeds', async (t) => {
  t.truthy(uploadedStorageKey)

  const res = await request
    .delete(`/api/files/${uploadedStorageKey}`)

  t.is(res.status, 200)
  t.true(res.body.success)

  const record = await Files.findOne({ storageKey: uploadedStorageKey }).lean()
  t.truthy(record!.deletedAt)
})

test.serial('Deleted file no longer appears in listing', async (t) => {
  const res = await request
    .get('/api/files')

  t.is(res.status, 200)
  t.true(res.body.success)

  const found = res.body.data.files.docs.find((f: any) => f.storageKey === uploadedStorageKey)
  t.falsy(found)
})

test.serial('Cannot delete the same file twice', async (t) => {
  t.truthy(uploadedStorageKey)

  const res = await request
    .delete(`/api/files/${uploadedStorageKey}`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.after.always('close server', () => {
  server.close()
})
