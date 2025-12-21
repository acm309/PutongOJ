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
  t.truthy(res.body.list)
  t.truthy(Array.isArray(res.body.list.docs))
  t.truthy(typeof res.body.list.total === 'number')

  // Visitors should only see OpenDiscussion and PublicAnnouncement
  const visibleTypes = [1, 2] // OpenDiscussion, PublicAnnouncement
  for (const doc of res.body.list.docs) {
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
  t.truthy(res.body.list)
  t.is(res.body.list.docs.length, 1)
  t.truthy(res.body.list.page === 1)
})

test('List discussions with sorting', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ sortBy: 'createdAt', sort: -1 })

  t.is(res.status, 200)
  t.truthy(res.body.list)
  t.truthy(Array.isArray(res.body.list.docs))
})

test('Get specific public discussion', async (t) => {
  // Discussion #1 should be OpenDiscussion (public)
  const res = await request
    .get('/api/discussions/1')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.is(res.body.discussionId, 1)
  t.truthy(res.body.title)
  t.truthy(res.body.author)
  t.truthy(Array.isArray(res.body.comments))
  t.is(res.body.isJury, false)
  
  // Should have at least one comment (initial content)
  t.true(res.body.comments.length > 0)
  t.truthy(res.body.comments[0].content)
  t.truthy(res.body.comments[0].author)
})

test('Get public announcement discussion', async (t) => {
  // Discussion #2 should be PublicAnnouncement
  const res = await request
    .get('/api/discussions/2')

  t.is(res.status, 200)
  t.is(res.body.discussionId, 2)
  t.truthy(res.body.title)
})

test('Cannot access private discussion as visitor', async (t) => {
  // Discussion #3 should be PrivateClarification
  const res = await request
    .get('/api/discussions/3')

  t.is(res.status, 404)
  t.truthy(res.body.error)
})

test('Get non-existent discussion', async (t) => {
  const res = await request
    .get('/api/discussions/99999')

  t.is(res.status, 404)
  t.truthy(res.body.error)
})

test('Invalid discussion ID', async (t) => {
  const res = await request
    .get('/api/discussions/invalid')

  t.is(res.status, 404)
  t.truthy(res.body.error)
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
  t.truthy(res.body.error)
})

test('Cannot add comment without login', async (t) => {
  const res = await request
    .post('/api/discussions/1/comments')
    .send({
      content: 'Test comment',
    })

  t.is(res.status, 401)
  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
