import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()

/** Authenticated admin session */
const requestAdmin = supertest.agent(server)
/** Unauthenticated session */
const requestAnon = supertest.agent(server)

const adminUser = userSeeds.admin

// Shared state across serial tests
let createdTagId: number

// ─── Setup ──────────────────────────────────────────────────────────────────

test.before('Login as root admin', async (t) => {
  const res = await requestAdmin
    .post('/api/account/login')
    .send({
      username: adminUser.uid,
      password: await encryptData(adminUser.pwd!),
    })

  t.is(res.status, 200)
  t.true(res.body.success)
})

// ─── Access control ─────────────────────────────────────────────────────────

test('Unauthenticated user cannot GET /api/admin/tags', async (t) => {
  const res = await requestAnon.get('/api/admin/tags')
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test('Unauthenticated user cannot POST /api/admin/tags', async (t) => {
  const res = await requestAnon
    .post('/api/admin/tags')
    .send({ name: 'unauthorized', color: 'default' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test('Unauthenticated user cannot PUT /api/admin/tags/:tagId', async (t) => {
  const res = await requestAnon
    .put('/api/admin/tags/1')
    .send({ name: 'unauthorized' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

// ─── findTags ───────────────────────────────────────────────────────────────

test('GET /api/admin/tags returns tag list', async (t) => {
  const res = await requestAdmin.get('/api/admin/tags')
  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
})

test('GET /api/admin/tags items include admin fields', async (t) => {
  const res = await requestAdmin.get('/api/admin/tags')
  t.is(res.status, 200)
  t.true(res.body.success)
  // If any tags exist, verify shape; otherwise just confirm the response
  for (const tag of res.body.data as any[]) {
    t.is(typeof tag.tagId, 'number')
    t.is(typeof tag.name, 'string')
    t.is(typeof tag.color, 'string')
  }
})

// ─── createTag ──────────────────────────────────────────────────────────────

test('POST /api/admin/tags fails with missing name', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/tags')
    .send({ color: 'default' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test('POST /api/admin/tags fails with missing color', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/tags')
    .send({ name: 'no-color-tag' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test('POST /api/admin/tags fails with invalid color', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/tags')
    .send({ name: 'bad-color', color: 'notacolor' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test('POST /api/admin/tags fails when name is too long', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/tags')
    .send({ name: 'a'.repeat(31), color: 'default' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test.serial('POST /api/admin/tags creates a tag successfully', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/tags')
    .send({ name: 'ava-test-tag', color: 'blue' })
  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data, null)

  // Confirm the tag now appears in the list
  const list = await requestAdmin.get('/api/admin/tags')
  t.true(list.body.success)
  const created = (list.body.data as any[]).find((tag: any) => tag.name === 'ava-test-tag')
  t.truthy(created)
  t.is(created.color, 'blue')
  createdTagId = created.tagId
})

// ─── updateTag ──────────────────────────────────────────────────────────────

test('PUT /api/admin/tags/:tagId fails with non-numeric tagId', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/tags/not-a-number')
    .send({ name: 'updated' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test('PUT /api/admin/tags/:tagId fails with negative tagId', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/tags/-1')
    .send({ name: 'updated' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test('PUT /api/admin/tags/:tagId fails with invalid color', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/tags/1')
    .send({ color: 'notacolor' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test('PUT /api/admin/tags/:tagId returns 404 for non-existent tag', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/tags/99999')
    .send({ name: 'ghost' })
  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('PUT /api/admin/tags/:tagId updates name and color', async (t) => {
  t.truthy(createdTagId, 'createTag serial test must run first')

  const res = await requestAdmin
    .put(`/api/admin/tags/${createdTagId}`)
    .send({ name: 'ava-test-tag-updated', color: 'red' })
  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data, null)

  // Confirm mutation in list
  const list = await requestAdmin.get('/api/admin/tags')
  const updated = (list.body.data as any[]).find((tag: any) => tag.tagId === createdTagId)
  t.truthy(updated)
  t.is(updated.name, 'ava-test-tag-updated')
  t.is(updated.color, 'red')
})

test.serial('PUT /api/admin/tags/:tagId can update name only', async (t) => {
  t.truthy(createdTagId, 'createTag serial test must run first')

  const res = await requestAdmin
    .put(`/api/admin/tags/${createdTagId}`)
    .send({ name: 'ava-test-name-only' })
  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('PUT /api/admin/tags/:tagId can update color only', async (t) => {
  t.truthy(createdTagId, 'createTag serial test must run first')

  const res = await requestAdmin
    .put(`/api/admin/tags/${createdTagId}`)
    .send({ color: 'green' })
  t.is(res.status, 200)
  t.true(res.body.success)
})

test.after.always('close server', () => {
  server.close()
})
