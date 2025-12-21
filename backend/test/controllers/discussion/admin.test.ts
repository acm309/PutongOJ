import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

const admin = userSeeds.admin

test.before('Login as admin', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: admin.uid,
      password: await encryptData(admin.pwd!),
    })

  t.is(login.status, 200)
})

test('Admin can see all discussions including private ones', async (t) => {
  const res = await request
    .get('/api/discussions')

  t.is(res.status, 200)
  t.truthy(res.body.list)
  t.truthy(Array.isArray(res.body.list.docs))
  
  // Admin should see all types including private clarifications
  const types = res.body.list.docs.map((d: any) => d.type)
  // Should include at least OpenDiscussion (1), PublicAnnouncement (2), and PrivateClarification (3)
  t.true(types.includes(1))
  t.true(types.includes(2))
  t.true(types.includes(3))
})

test('Admin can access any private discussion', async (t) => {
  // Discussion #3 is a private discussion created by another user
  const res = await request
    .get('/api/discussions/3')

  t.is(res.status, 200)
  t.is(res.body.discussionId, 3)
  t.truthy(res.body.title)
  t.is(res.body.isJury, true) // Admin should be marked as jury
})

test('Admin can create public announcement', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 2, // PublicAnnouncement
      title: 'Admin Announcement',
      content: 'This is an important announcement',
    })

  t.is(res.status, 200)
  t.truthy(res.body.discussionId)
  
  // Verify the created announcement
  const getRes = await request
    .get(`/api/discussions/${res.body.discussionId}`)
  
  t.is(getRes.status, 200)
  t.is(getRes.body.type, 2)
  t.is(getRes.body.title, 'Admin Announcement')
})

test('Admin can add comment to announcement', async (t) => {
  const res = await request
    .post('/api/discussions/2/comments')
    .send({
      content: 'Admin comment on announcement',
    })

  t.is(res.status, 200)
  
  // Verify comment was added
  const getRes = await request
    .get('/api/discussions/2')
  
  t.is(getRes.status, 200)
  const comments = getRes.body.comments
  const lastComment = comments[comments.length - 1]
  t.is(lastComment.content, 'Admin comment on announcement')
})

test('Admin can create open discussion', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1, // OpenDiscussion
      title: 'Admin Discussion',
      content: 'Discussion created by admin',
    })

  t.is(res.status, 200)
  t.truthy(res.body.discussionId)
})

test('Admin can create private clarification', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 3, // PrivateClarification
      title: 'Admin Private Question',
      content: 'Private question from admin',
    })

  t.is(res.status, 200)
  t.truthy(res.body.discussionId)
})

test('Admin can create discussion with problem reference', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 1,
      title: 'Admin Question about Problem',
      problem: 1001,
      content: 'Question about problem 1001',
    })

  t.is(res.status, 200)
  t.truthy(res.body.discussionId)
  
  const getRes = await request
    .get(`/api/discussions/${res.body.discussionId}`)
  
  t.is(getRes.status, 200)
  t.truthy(getRes.body.problem)
  t.is(getRes.body.problem.pid, 1001)
})

test('Admin sees isJury=true for discussions', async (t) => {
  const res = await request
    .get('/api/discussions/1')

  t.is(res.status, 200)
  t.is(res.body.isJury, true)
})

test.after.always('close server', () => {
  server.close()
})
