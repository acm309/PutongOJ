import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()

/** Authenticated admin session */
const requestAdmin = supertest.agent(server)

/** Unauthenticated session (fresh agent, never logged in) */
const requestAnon = supertest.agent(server)

const adminUser = userSeeds.admin
const primaryUser = userSeeds.primaryuser
// Use kevin63 as the password-change target so we don't corrupt primaryUser's
// password and break the session-dependent tests that run after this file.
const pwdTestUser = userSeeds.kevin63

// Shared state updated by serial tests
let createdDiscussionId: number
let createdCommentId: number

// ─── Setup ─────────────────────────────────────────────────────────────────

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

// ─── Access control ────────────────────────────────────────────────────────

test('Unauthenticated user cannot access admin endpoints', async (t) => {
  const res = await requestAnon.get('/api/admin/users')
  // authnMiddleware returns 401 directly
  t.is(res.status, 401)
})

// ─── findUsers ─────────────────────────────────────────────────────────────

test('Find users', async (t) => {
  const res = await requestAdmin.get('/api/admin/users')
  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data)
  t.true(Array.isArray(res.body.data.docs))
  t.true(res.body.data.docs.length > 0)

  const firstUser = res.body.data.docs[0]
  t.is(typeof firstUser.uid, 'string')
  t.is(typeof firstUser.privilege, 'number')
})

test('Find users (pageSize)', async (t) => {
  const res = await requestAdmin.get('/api/admin/users?pageSize=1')
  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.docs.length, 1)
})

test('Find users (keyword filter)', async (t) => {
  const res = await requestAdmin.get(`/api/admin/users?keyword=${adminUser.uid}`)
  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data.docs))
})

// ─── getUser ───────────────────────────────────────────────────────────────

test('Get user detail', async (t) => {
  const res = await requestAdmin.get(`/api/admin/users/${adminUser.uid}`)
  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.uid, adminUser.uid)
  t.is(typeof res.body.data.privilege, 'number')
})

test('Get user - fails for non-existent uid', async (t) => {
  const res = await requestAdmin.get('/api/admin/users/____no_such_user____')
  // loadUser sends a 404 HTTP response
  t.is(res.status, 404)
})

// ─── updateUserPassword ────────────────────────────────────────────────────

test.serial('Update user password - weak password rejected', async (t) => {
  // 'weak' is too short and not complex
  const encryptedPwd = await encryptData('weak')
  const res = await requestAdmin
    .put(`/api/admin/users/${pwdTestUser.uid}/password`)
    .send({ newPassword: encryptedPwd })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Update user password', async (t) => {
  const strongPwd = 'Adm1nStr0ng!'
  const encryptedPwd = await encryptData(strongPwd)
  const res = await requestAdmin
    .put(`/api/admin/users/${pwdTestUser.uid}/password`)
    .send({ newPassword: encryptedPwd })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Update user password - invalid base64 rejected', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/users/${pwdTestUser.uid}/password`)
    .send({ newPassword: 'not-valid-base64-!@#$' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Update user password - fails for non-existent user', async (t) => {
  const encryptedPwd = await encryptData('Adm1nStr0ng!')
  const res = await requestAdmin
    .put('/api/admin/users/____no_such_user____/password')
    .send({ newPassword: encryptedPwd })

  // loadEditingUser → loadUser sends a 404 HTTP response
  t.is(res.status, 404)
})

// ─── getUserOAuthConnections ────────────────────────────────────────────────

test('Get user OAuth connections', async (t) => {
  const res = await requestAdmin.get(`/api/admin/users/${adminUser.uid}/oauth`)
  t.is(res.status, 200)
  t.true(res.body.success)
  // Result should be a record (object)
  t.is(typeof res.body.data, 'object')
  t.false(Array.isArray(res.body.data))
})

// ─── findSolutions ─────────────────────────────────────────────────────────

test('Find solutions', async (t) => {
  const res = await requestAdmin.get('/api/admin/solutions')
  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data)
  t.true(Array.isArray(res.body.data.docs))
})

test('Find solutions (filter by user)', async (t) => {
  const res = await requestAdmin.get(`/api/admin/solutions?user=${primaryUser.uid}`)
  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data.docs))
  // Every returned solution should belong to primaryUser
  for (const doc of res.body.data.docs) {
    t.is(doc.uid, primaryUser.uid)
  }
})

test('Find solutions - fails with invalid query', async (t) => {
  // "problem" should be a number, pass a non-numeric string
  const res = await requestAdmin.get('/api/admin/solutions?problem=notanumber')
  t.is(res.status, 200)
  t.false(res.body.success)
})

// ─── exportSolutions ──────────────────────────────────────────────────────

test('Export solutions', async (t) => {
  const res = await requestAdmin.get('/api/admin/solutions/export')
  t.is(res.status, 200)
  t.true(res.body.success)
  // exportSolutions returns a flat array (not paginated)
  t.true(Array.isArray(res.body.data))
})

// ─── sendNotificationBroadcast ─────────────────────────────────────────────

test.serial('Send broadcast notification - fails without content', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/notifications/broadcast')
    .send({ title: 'Only title, no content' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Send broadcast notification - fails without title', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/notifications/broadcast')
    .send({ content: 'Only content, no title' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Send broadcast notification', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/notifications/broadcast')
    .send({ title: 'System Notice', content: 'Maintenance at midnight' })

  t.is(res.status, 200)
  t.true(res.body.success)
})

// ─── sendNotificationUser ──────────────────────────────────────────────────

test.serial('Send user notification - fails for non-existent user', async (t) => {
  const res = await requestAdmin
    .post('/api/admin/notifications/users/____no_such_user____')
    .send({ title: 'Hi', content: 'Hello' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Send user notification', async (t) => {
  const res = await requestAdmin
    .post(`/api/admin/notifications/users/${adminUser.uid}`)
    .send({ title: 'Personal Notice', content: 'Hello admin!' })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Send user notification - fails without required fields', async (t) => {
  const res = await requestAdmin
    .post(`/api/admin/notifications/users/${adminUser.uid}`)
    .send({ title: 'Missing content' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

// ─── updateDiscussion (admin-only endpoint) ────────────────────────────────

test.serial('Setup: create discussion for admin update tests', async (t) => {
  const res = await requestAdmin
    .post('/api/discussions')
    .send({
      type: 1, // OpenDiscussion
      title: 'Admin Update Target',
      content: 'This discussion will be updated via admin endpoint',
    })

  t.is(res.status, 200)
  t.true(res.body.success)
  createdDiscussionId = res.body.data.discussionId
  t.truthy(createdDiscussionId)
})

test.serial('Update discussion title and pinned', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/discussions/${createdDiscussionId}`)
    .send({ title: 'Updated Title', pinned: true })

  t.is(res.status, 200)
  t.true(res.body.success)

  // Verify the title changed
  const verify = await requestAdmin.get(`/api/discussions/${createdDiscussionId}`)
  t.is(verify.status, 200)
  t.is(verify.body.data.title, 'Updated Title')
  t.is(verify.body.data.pinned, true)
})

test.serial('Update discussion type', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/discussions/${createdDiscussionId}`)
    .send({ type: 2 }) // PublicAnnouncement

  t.is(res.status, 200)
  t.true(res.body.success)
})

test('Update discussion - fails for invalid id', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/discussions/0')
    .send({ title: 'Test' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test('Update discussion - fails for non-existent id', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/discussions/999999')
    .send({ title: 'Ghost' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Update discussion - fails for non-existent author', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/discussions/${createdDiscussionId}`)
    .send({ author: '____no_such_user____' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Update discussion - fails for non-existent problem', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/discussions/${createdDiscussionId}`)
    .send({ problem: 99999999 })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Update discussion - set problem to null', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/discussions/${createdDiscussionId}`)
    .send({ problem: null })

  t.is(res.status, 200)
  t.true(res.body.success)
})

// ─── updateComment (admin-only endpoint) ──────────────────────────────────

test.serial('Setup: add a comment to use in admin comment tests', async (t) => {
  const res = await requestAdmin
    .post(`/api/discussions/${createdDiscussionId}/comments`)
    .send({ content: 'This comment will be hidden by admin' })

  t.is(res.status, 200)
  t.true(res.body.success)

  // Fetch the discussion to get the comment ID
  const disc = await requestAdmin.get(`/api/discussions/${createdDiscussionId}`)
  t.is(disc.status, 200)
  const comments = disc.body.data.comments
  t.true(comments.length > 0)
  createdCommentId = comments[comments.length - 1].commentId
  t.truthy(createdCommentId)
})

test.serial('Update comment - hide', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/comments/${createdCommentId}`)
    .send({ hidden: true })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Update comment - unhide', async (t) => {
  const res = await requestAdmin
    .put(`/api/admin/comments/${createdCommentId}`)
    .send({ hidden: false })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test('Update comment - fails for invalid id', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/comments/0')
    .send({ hidden: true })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test('Update comment - fails for non-existent id', async (t) => {
  const res = await requestAdmin
    .put('/api/admin/comments/999999')
    .send({ hidden: true })

  t.is(res.status, 200)
  t.false(res.body.success)
})

// ─── Teardown ──────────────────────────────────────────────────────────────

test.after.always('close server', () => {
  server.close()
})
