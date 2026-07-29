import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

// ─── GET /api/contests ────────────────────────────────────────────────────────

test('List contests (unauthenticated)', async (t) => {
  const res = await request.get('/api/contests')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data)
  t.true(Array.isArray(res.body.data.docs))
  t.is(typeof res.body.data.total, 'number')
  t.is(typeof res.body.data.page, 'number')
  t.is(typeof res.body.data.pages, 'number')
  t.is(typeof res.body.data.limit, 'number')
})

test('List contests with title filter that matches nothing', async (t) => {
  const res = await request.get('/api/contests').query({ title: 'Nonexistent XYZ 999' })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.total, 0)
  t.is(res.body.data.docs.length, 0)
})

test('List contests with pagination', async (t) => {
  const res = await request.get('/api/contests').query({ page: 1, pageSize: 2 })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.docs.length <= 2)
})

test('List contests with invalid sortBy is rejected', async (t) => {
  const res = await request.get('/api/contests').query({ sortBy: 'invalid' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

// ─── Authenticated-only endpoints return 401 for unauthenticated visitors ─────

test('Get contest detail without login returns 401', async (t) => {
  const res = await request.get('/api/contests/1')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test('Get participation status without login returns 401', async (t) => {
  const res = await request.get('/api/contests/1/participation')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test('Participate without login returns 401', async (t) => {
  const res = await request.post('/api/contests/1/participation').send({})

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test('Get ranklist without login returns 401', async (t) => {
  const res = await request.get('/api/contests/1/ranklist')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
