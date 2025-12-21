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
  t.truthy(res.body.list)
  t.truthy(Array.isArray(res.body.list.docs))
  
  // User should see public discussions and their own private ones
  for (const doc of res.body.list.docs) {
    t.truthy(doc.discussionId)
    t.truthy(doc.title)
  }
})

test('Can access own private discussion', async (t) => {
  // Discussion #3 is a private discussion created by primaryuser
  const res = await request
    .get('/api/discussions/3')

  t.is(res.status, 200)
  t.is(res.body.discussionId, 3)
  t.truthy(res.body.title)
})

test('Create open discussion', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1, // OpenDiscussion
      title: 'Test Discussion from User',
      content: 'This is a test discussion content',
    })

  t.is(res.status, 200)
  t.truthy(res.body.discussionId)
  
  // Verify the created discussion
  const getRes = await request
    .get(`/api/discussions/${res.body.discussionId}`)
  
  t.is(getRes.status, 200)
  t.is(getRes.body.title, 'Test Discussion from User')
  t.true(getRes.body.comments.length > 0)
  t.is(getRes.body.comments[0].content, 'This is a test discussion content')
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
  t.truthy(res.body.discussionId)
})

test('Create discussion with problem reference', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1, // OpenDiscussion
      title: 'Question about Problem 1000',
      problem: 1000,
      content: 'I have a question about this problem',
    })

  t.is(res.status, 200)
  t.truthy(res.body.discussionId)
  
  // Verify problem reference
  const getRes = await request
    .get(`/api/discussions/${res.body.discussionId}`)
  
  t.is(getRes.status, 200)
  t.truthy(getRes.body.problem)
  t.is(getRes.body.problem.pid, 1000)
})

test('Cannot create public announcement as normal user', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 2, // PublicAnnouncement
      title: 'Trying to create announcement',
      content: 'Should fail',
    })

  t.is(res.status, 403)
  t.truthy(res.body.error)
})

test('Create discussion with missing title', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1,
      content: 'Content without title',
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Create discussion with missing content', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1,
      title: 'Title without content',
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
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
  const comments = getRes.body.comments
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

  t.is(res.status, 403)
  t.truthy(res.body.error)
})

test('Add comment with missing content', async (t) => {
  const res = await request
    .post('/api/discussions/1/comments')
    .send({})

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Add comment to non-existent discussion', async (t) => {
  const res = await request
    .post('/api/discussions/99999/comments')
    .send({
      content: 'Comment on non-existent discussion',
    })

  t.is(res.status, 404)
  t.truthy(res.body.error)
})

test('Filter discussions by type', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ type: 1 }) // OpenDiscussion only

  t.is(res.status, 200)
  t.truthy(res.body.list)
  
  for (const doc of res.body.list.docs) {
    t.is(doc.type, 1)
  }
})

test('Filter discussions by author', async (t) => {
  const res = await request
    .get('/api/discussions')
    .query({ author: 'admin' })

  t.is(res.status, 200)
  t.truthy(res.body.list)
  
  for (const doc of res.body.list.docs) {
    t.is(doc.author.uid, 'admin')
  }
})

test.after.always('close server', () => {
  server.close()
})
