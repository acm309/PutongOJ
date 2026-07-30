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
      username: admin.username,
      password: await encryptData(admin.pwd!),
    })

  t.is(login.status, 200)
})

test('Admin can see all discussions including private ones', async (t) => {
  const res = await request
    .get('/api/discussions')

  t.is(res.status, 200)
  t.truthy(res.body.data)
  t.truthy(Array.isArray(res.body.data.items))

  // Admin should see all types including private clarifications
  const types = res.body.data.items.map((d: any) => d.type)
  // Should include at least OpenDiscussion (1), PublicAnnouncement (2), and PrivateClarification (3)
  t.true(types.includes('OPEN_DISCUSSION'))
  t.true(types.includes('PUBLIC_ANNOUNCEMENT'))
  t.true(types.includes('PRIVATE_CLARIFICATION'))
})

test('Admin can access any private discussion', async (t) => {
  // Discussion #3 is a private discussion created by another user
  const res = await request
    .get('/api/discussions/3')

  t.is(res.status, 200)
  t.is(res.body.data.id, 3)
  t.truthy(res.body.data.title)
  t.is(res.body.data.isJury, true) // Admin should be marked as jury
})

test('Admin can create public announcement', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 'PUBLIC_ANNOUNCEMENT', // PublicAnnouncement
      title: 'Admin Announcement',
      content: 'This is an important announcement',
    })

  t.is(res.status, 200)
  t.truthy(res.body.data.id)

  // Verify the created announcement
  const getRes = await request
    .get(`/api/discussions/${res.body.data.id}`)

  t.is(getRes.status, 200)
  t.is(getRes.body.data.type, 'PUBLIC_ANNOUNCEMENT')
  t.is(getRes.body.data.title, 'Admin Announcement')
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
  const comments = getRes.body.data.comments
  const lastComment = comments.at(-1)
  t.is(lastComment.content, 'Admin comment on announcement')
})

test('Admin can create open discussion', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 'OPEN_DISCUSSION', // OpenDiscussion
      title: 'Admin Discussion',
      content: 'Discussion created by admin',
    })

  t.is(res.status, 200)
  t.truthy(res.body.data.id)
})

test('Admin can create private clarification', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 'PRIVATE_CLARIFICATION', // PrivateClarification
      title: 'Admin Private Question',
      content: 'Private question from admin',
    })

  t.is(res.status, 200)
  t.truthy(res.body.data.id)
})

test('Admin can create discussion with problem reference', async (t) => {
  const res = await request
    .post('/api/discussions')
    .send({
      type: 'OPEN_DISCUSSION',
      title: 'Admin Question about Problem',
      problemId: 1001,
      content: 'Question about problem 1001',
    })

  t.is(res.status, 200)
  t.truthy(res.body.data.id)

  const getRes = await request
    .get(`/api/discussions/${res.body.data.id}`)

  t.is(getRes.status, 200)
  t.truthy(getRes.body.data.problem)
  t.is(getRes.body.data.problem.id, 1001)
})

test('Admin sees isJury=true for discussions', async (t) => {
  const res = await request
    .get('/api/discussions/1')

  t.is(res.status, 200)
  t.is(res.body.data.isJury, true)
})

test.after.always('close server', () => {
  server.close()
})
