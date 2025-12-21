import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

const user = userSeeds.primaryuser

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: user.uid,
      password: await encryptData(user.pwd!),
    })

  t.is(login.status, 200)
})

test('List discussions - logged in user sees more', async (t) => {
  const res = await request
    .get('/api/discussions')

  t.is(res.status, 200)
  t.truthy(res.body.data)
  t.truthy(Array.isArray(res.body.data.docs))
  
  // User should see public discussions and their own private ones
  for (const doc of res.body.data.docs) {
    t.truthy(doc.discussionId)
    t.truthy(doc.title)
  }
})

test('Can access own private discussion', async (t) => {
  // Discussion #3 is a private discussion created by primaryuser
  const res = await request
    .get('/api/discussions/3')

  t.is(res.status, 200)
  t.is(res.body.data.discussionId, 3)
  t.truthy(res.body.data.title)
})

test('Cannot create open discussion as normal user', async (t) => {
  // Note: Current implementation requires admin/managed status for all public discussion types
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1, // OpenDiscussion
      title: 'Test Discussion from User',
      content: 'This is a test discussion content',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Create private clarification', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 3, // PrivateClarification
      title: 'Private Question',
      content: 'This is a private question',
    })

  t.is(res.status, 200)
  t.truthy(res.body.data.discussionId)
})

test('Cannot create discussion with problem reference as normal user', async (t) => {
  // Note: Current implementation requires admin/managed status for OpenDiscussion type
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1, // OpenDiscussion
      title: 'Question about Problem 1000',
      problem: 1000,
      content: 'I have a question about this problem',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Cannot create public announcement as normal user', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 2, // PublicAnnouncement
      title: 'Trying to create announcement',
      content: 'Should fail',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Create discussion with missing title', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1,
      content: 'Content without title',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Create discussion with missing content', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1,
      title: 'Title without content',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Add comment to open discussion', async (t) => {
  const res = await request
    .post('/api/discussions/1/comments')
    .send({
      content: 'This is a test comment',
    })

  t.is(res.status, 200)
  
  // Verify comment was added
  const getRes = await request
    .get('/api/discussions/1')
  
  t.is(getRes.status, 200)
  const comments = getRes.body.data.comments
  const lastComment = comments[comments.length - 1]
  t.is(lastComment.content, 'This is a test comment')
  t.is(lastComment.author.uid, user.uid)
})

test('Cannot add comment to announcement as normal user', async (t) => {
  const res = await request
    .post('/api/discussions/2/comments')
    .send({
      content: 'Trying to comment on announcement',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Add comment with missing content', async (t) => {
  const res = await request
    .post('/api/discussions/1/comments')
    .send({})

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Add comment to non-existent discussion', async (t) => {
  const res = await request
    .post('/api/discussions/99999/comments')
    .send({
      content: 'Comment on non-existent discussion',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Filter discussions by type', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ type: 1 }) // OpenDiscussion only

  t.is(res.status, 200)
  t.truthy(res.body.data)
  
  for (const doc of res.body.data.docs) {
    t.is(doc.type, 1)
  }
})

test('Filter discussions by author', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ author: 'admin' })

  t.is(res.status, 200)
  t.truthy(res.body.data)
  
  for (const doc of res.body.data.docs) {
    t.is(doc.author.uid, 'admin')
  }
})

test.after.always('close server', () => {
  server.close()
})
