import { resolve } from 'node:path'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { getDatabase } from '../../../src/config/postgres'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'
import { userSeeds } from '../../seeds/user'

const server = app.listen()

/** Authenticated admin session */
const requestAdmin = supertest.agent(server)

/** Authenticated primary user session */
const requestUser = supertest.agent(server)

const filepath = resolve(__dirname, '../utils.test.ts')

let userStorageKey: string | null = null
let adminStorageKey: string | null = null
let primaryUserId: number | null = null

// ─── Setup ─────────────────────────────────────────────────────────────────

test.before('Login as admin', async (t) => {
  const res = await requestAdmin
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.before('Set storage quota and login as primary user', async (t) => {
  const database = await getDatabase()
  await database.user.update({ where: { username: 'primaryuser' }, data: { storageQuota: 2 * 1024 * 1024 } })
  primaryUserId = (await database.user.findUniqueOrThrow({
    where: { username: 'primaryuser' },
    select: { id: true },
  })).id

  const login = await requestUser
    .post('/api/account/login')
    .send({
      username: 'primaryuser',
      password: await encryptData(userSeeds.primaryuser.pwd!),
    })

  t.is(login.status, 200)
  t.true(login.body.success)
})

test.serial('Setup: upload a file as primary user', async (t) => {
  const res = await requestUser
    .post('/api/upload')
    .attach('image', filepath)

  t.is(res.status, 200)
  t.true(res.body.success)
  userStorageKey = res.body.data.storageKey
  t.truthy(userStorageKey)
})

test.serial('Setup: upload a file as admin', async (t) => {
  const res = await requestAdmin
    .post('/api/upload')
    .attach('image', filepath)

  t.is(res.status, 200)
  t.true(res.body.success)
  adminStorageKey = res.body.data.storageKey
  t.truthy(adminStorageKey)
})

// ─── Access control ────────────────────────────────────────────────────────

test('Unauthenticated user cannot list admin files', async (t) => {
  const requestAnon = supertest(server)
  const res = await requestAnon.get('/api/admin/files')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Non-admin user cannot list admin files', async (t) => {
  const res = await requestUser.get('/api/admin/files')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

// ─── findFiles (admin) ─────────────────────────────────────────────────────

test.serial('Admin can list all files', async (t) => {
  const res = await requestAdmin.get('/api/admin/files')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data)
  t.true(Array.isArray(res.body.data.items))
  t.true(res.body.data.items.length > 0)
  t.is(typeof res.body.data.total, 'number')
})

test.serial('Admin file listing includes files from all users', async (t) => {
  const res = await requestAdmin.get('/api/admin/files')

  t.is(res.status, 200)
  t.true(res.body.success)

  const storageKeys = res.body.data.items.map((f: any) => f.storageKey)
  t.true(storageKeys.includes(userStorageKey))
  t.true(storageKeys.includes(adminStorageKey))
})

test.serial('Admin can filter files by uploader', async (t) => {
  const res = await requestAdmin.get(`/api/admin/files?ownerId=${primaryUserId}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data.items))

  const storageKeys = res.body.data.items.map((f: any) => f.storageKey)
  t.true(storageKeys.includes(userStorageKey))
  // Admin's file should not appear in primaryuser's listing
  t.false(storageKeys.includes(adminStorageKey))
})

test.serial('Admin file filter returns uploader uid in each document', async (t) => {
  const res = await requestAdmin.get(`/api/admin/files?ownerId=${primaryUserId}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.items.length > 0)

  for (const doc of res.body.data.items) {
    t.is(doc.ownerId, primaryUserId)
  }
})

test.serial('Admin file filter by non-existent owner returns 404', async (t) => {
  const res = await requestAdmin.get('/api/admin/files?ownerId=999999')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.serial('Admin file listing supports pagination', async (t) => {
  const res = await requestAdmin.get('/api/admin/files?pageSize=1')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.items.length, 1)
  t.is(res.body.data.pageSize, 1)
})

test.serial('Admin file listing fails with invalid query parameters', async (t) => {
  const res = await requestAdmin.get('/api/admin/files?page=invalid')

  t.is(res.status, 200)
  t.is(res.body.success, false)
})

// ─── removeFile (admin) ────────────────────────────────────────────────────

test.serial('Admin delete fails for non-existent storage key', async (t) => {
  const res = await requestAdmin
    .delete('/api/admin/files/____nonexistent____')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.serial('Admin can delete a file uploaded by another user', async (t) => {
  t.truthy(userStorageKey)

  const res = await requestAdmin
    .delete(`/api/admin/files/${userStorageKey}`)

  t.is(res.status, 200)
  t.true(res.body.success)

  const database = await getDatabase()
  const record = await database.file.findUnique({
    where: { storageKey: userStorageKey! },
  })
  t.truthy(record!.deletedAt)
})

test.serial('Admin cannot delete an already-deleted file', async (t) => {
  t.truthy(userStorageKey)

  const res = await requestAdmin
    .delete(`/api/admin/files/${userStorageKey}`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.serial('Deleted file no longer appears in admin listing', async (t) => {
  const res = await requestAdmin.get('/api/admin/files')

  t.is(res.status, 200)
  t.true(res.body.success)

  const found = res.body.data.items.find((f: any) => f.storageKey === userStorageKey)
  t.falsy(found)
})

// ─── Teardown ──────────────────────────────────────────────────────────────

test.after.always('close server', () => {
  server.close()
})
