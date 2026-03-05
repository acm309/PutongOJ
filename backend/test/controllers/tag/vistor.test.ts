import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

// ─── GET /api/tags ──────────────────────────────────────────────────────────

test('GET /api/tags is accessible without authentication', async (t) => {
  const res = await request.get('/api/tags')
  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
})

test('GET /api/tags response has correct content-type', async (t) => {
  const res = await request.get('/api/tags')
  t.is(res.status, 200)
  t.regex(res.type, /application\/json/)
})

test('GET /api/tags items have public-safe shape (no createdAt/updatedAt)', async (t) => {
  const res = await request.get('/api/tags')
  t.is(res.status, 200)
  t.true(res.body.success)
  for (const tag of res.body.data as any[]) {
    t.is(typeof tag.tagId, 'number')
    t.is(typeof tag.name, 'string')
    t.is(typeof tag.color, 'string')
    t.false('createdAt' in tag)
    t.false('updatedAt' in tag)
  }
})

test.after.always('close server', () => {
  server.close()
})
