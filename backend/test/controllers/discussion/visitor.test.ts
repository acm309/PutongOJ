import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

test('List discussions - should show public discussions only', async (t) => {
  const res = await request
    .get('/api/discussions')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(res.body.data)
  t.truthy(Array.isArray(res.body.data.docs))
  t.truthy(typeof res.body.data.total === 'number')

  // Visitors should only see OpenDiscussion and PublicAnnouncement
  const visibleTypes = [ 1, 2 ] // OpenDiscussion, PublicAnnouncement
  for (const doc of res.body.data.docs) {
    t.true(visibleTypes.includes(doc.type))
    t.truthy(doc.discussionId)
    t.truthy(doc.title)
    t.truthy(doc.author)
    t.truthy(doc.author.uid)
  }
})

test('List discussions with pagination', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ page: 1, pageSize: 1 })

  t.is(res.status, 200)
  t.truthy(res.body.data)
  t.is(res.body.data.docs.length, 1)
  t.truthy(res.body.data.page === 1)
})

test('List discussions with sorting', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ sortBy: 'createdAt', sort: -1 })

  t.is(res.status, 200)
  t.truthy(res.body.data)
  t.truthy(Array.isArray(res.body.data.docs))
})

test('Get specific public discussion', async (t) => {
  // Discussion #1 should be OpenDiscussion (public)
  const res = await request
    .get('/api/discussions/1')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.is(res.body.data.discussionId, 1)
  t.truthy(res.body.data.title)
  t.truthy(res.body.data.author)
  t.truthy(Array.isArray(res.body.data.comments))
  t.is(res.body.data.isJury, false)

  // Should have at least one comment (initial content)
  t.true(res.body.data.comments.length > 0)
  t.truthy(res.body.data.comments[0].content)
  t.truthy(res.body.data.comments[0].author)
})

test('Get public announcement discussion', async (t) => {
  // Discussion #2 should be PublicAnnouncement
  const res = await request
    .get('/api/discussions/2')

  t.is(res.status, 200)
  t.is(res.body.data.discussionId, 2)
  t.truthy(res.body.data.title)
})

test('Cannot access private discussion as visitor', async (t) => {
  // Discussion #3 should be PrivateClarification
  const res = await request
    .get('/api/discussions/3')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
  t.truthy(res.body.message)
})

test('Get non-existent discussion', async (t) => {
  const res = await request
    .get('/api/discussions/99999')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
  t.truthy(res.body.message)
})

test('Invalid discussion ID', async (t) => {
  const res = await request
    .get('/api/discussions/invalid')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
  t.truthy(res.body.message)
})

test('Cannot create discussion without login', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1,
      title: 'Test Discussion',
      content: 'Test content',
    })

  t.is(res.status, 401)
  t.truthy(res.body.data || res.body.error)
})

test('Cannot add comment without login', async (t) => {
  const res = await request
    .post('/api/discussions/1/comments')
    .send({
      content: 'Test comment',
    })

  t.is(res.status, 401)
  t.truthy(res.body.data || res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
