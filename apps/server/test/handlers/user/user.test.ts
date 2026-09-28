import { OAuth, User } from '@putong-oj/db'
import { ErrorCode, OAuthProvider, UserPrivilege } from '@putong-oj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app.ts'
import { encryptData } from '../../../src/services/crypto.ts'

const server = app.listen()
const request = supertest.agent(server)

const uid = 'test18315'
const pwd = 'Aa@123456'
const newPwd = 'Aa@654321'
const mail = 'account@example.com'

test.before('Create user and login', async (t) => {
  let r = await request
    .post('/api/account/register')
    .send({ username: uid, password: await encryptData(pwd) })
  t.is(r.status, 200)

  r = await request
    .post('/api/account/login')
    .send({ username: uid, password: await encryptData(pwd) })
  t.is(r.status, 200)

  r = await request
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.uid, uid)
  t.is(r.body.data.privilege, UserPrivilege.User)
  t.false(r.body.data.verified)

  // Newly registered users are unverified; mark this one as verified so that
  // the profile-update tests below can exercise fields gated by verification.
  await User.updateOne({ uid }, { $set: { verified: true } })
})

test('Update user with nick not valid (too long)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ nick: 'a'.repeat(31) })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user\'s nick then clear', async (t) => {
  let r = await request
    .put('/api/account/profile')
    .send({ nick: 'test20424' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.nick, 'test20424')

  r = await request
    .put('/api/account/profile')
    .send({ nick: '' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.nick, '')
})

test('Update user with motto not valid (too long)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ motto: 'a'.repeat(301) })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user\'s motto then clear', async (t) => {
  let r = await request
    .put('/api/account/profile')
    .send({ motto: 'test19025' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.motto, 'test19025')

  r = await request
    .put('/api/account/profile')
    .send({ motto: '' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.motto, '')
})

test('Unverified user cannot update gated profile fields', async (t) => {
  const unverifiedUid = 'testunverified'
  const requestUnverified = supertest.agent(server)

  let r = await requestUnverified
    .post('/api/account/register')
    .send({ username: unverifiedUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)
  t.false(r.body.data.verified)

  r = await requestUnverified
    .put('/api/account/profile')
    .send({ motto: 'test19025' })
  t.is(r.status, 200)
  t.false(r.body.success)
  t.is(r.body.code, ErrorCode.Forbidden)
})

test('Verify account requires a CJLU SSO connection', async (t) => {
  const unverifiedUid = 'testverifyreq'
  const requestUnverified = supertest.agent(server)

  let r = await requestUnverified
    .post('/api/account/register')
    .send({ username: unverifiedUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await requestUnverified
    .post('/api/account/verify')
  t.is(r.status, 200)
  t.false(r.body.success)
  t.is(r.body.code, ErrorCode.Forbidden)
})

test('Verify account rejects a mismatched CJLU SSO provider id', async (t) => {
  const unverifiedUid = 'testverifymismatch'
  const requestUnverified = supertest.agent(server)

  let r = await requestUnverified
    .post('/api/account/register')
    .send({ username: unverifiedUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)

  const user = await User.findOne({ uid: unverifiedUid })
  t.truthy(user)
  await new OAuth({
    user: user!._id,
    provider: OAuthProvider.CJLU,
    providerId: 'test-cjlu-mismatch',
    displayName: 'tester',
    accessToken: 'test-token',
  }).save()

  r = await requestUnverified
    .post('/api/account/verify')
  t.is(r.status, 200)
  t.false(r.body.success)
  t.is(r.body.code, ErrorCode.Forbidden)
})

test('Verify account via CJLU SSO unlocks gated fields', async (t) => {
  const unverifiedUid = 'testverified'
  const requestUnverified = supertest.agent(server)

  let r = await requestUnverified
    .post('/api/account/register')
    .send({ username: unverifiedUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)

  const user = await User.findOne({ uid: unverifiedUid })
  t.truthy(user)
  await new OAuth({
    user: user!._id,
    provider: OAuthProvider.CJLU,
    providerId: unverifiedUid,
    displayName: 'tester',
    accessToken: 'test-token',
  }).save()

  r = await requestUnverified
    .post('/api/account/verify')
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await requestUnverified
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.data.verified)

  r = await requestUnverified
    .put('/api/account/profile')
    .send({ motto: 'verified motto' })
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.motto, 'verified motto')
})

test('User can unbind only their own OAuth connection', async (t) => {
  const userUid = 'testunbind'
  const otherUid = 'testunbindother'
  const requestUser = supertest.agent(server)

  let r = await requestUser
    .post('/api/account/register')
    .send({ username: userUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await requestUser
    .post('/api/account/login')
    .send({ username: userUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await supertest(server)
    .post('/api/account/register')
    .send({ username: otherUid, password: await encryptData(pwd) })
  t.is(r.status, 200)
  t.true(r.body.success)

  const user = await User.findOne({ uid: userUid })
  const otherUser = await User.findOne({ uid: otherUid })
  t.truthy(user)
  t.truthy(otherUser)

  await new OAuth({
    user: user!._id,
    provider: OAuthProvider.CJLU,
    providerId: userUid,
    displayName: 'tester',
    accessToken: 'test-token',
  }).save()
  await new OAuth({
    user: otherUser!._id,
    provider: OAuthProvider.CJLU,
    providerId: otherUid,
    displayName: 'other tester',
    accessToken: 'test-token',
  }).save()

  r = await requestUser.delete(`/api/oauth/${OAuthProvider.CJLU}`)
  t.is(r.status, 200)
  t.true(r.body.success)

  t.is(await OAuth.countDocuments({ user: user!._id, provider: OAuthProvider.CJLU }), 0)
  t.is(await OAuth.countDocuments({ user: otherUser!._id, provider: OAuthProvider.CJLU }), 1)
})

test('Update user with school not valid (too long)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ school: 'a'.repeat(31) })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user\'s school then clear', async (t) => {
  let r = await request
    .put('/api/account/profile')
    .send({ school: 'test31975' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.school, 'test31975')

  r = await request
    .put('/api/account/profile')
    .send({ school: '' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.school, '')
})

test('Update user with mail not valid (too long)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ mail: 'a'.repeat(255) })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user with mail not valid (invalid email)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ mail: 'test' })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user\'s mail then clear', async (t) => {
  let r = await request
    .put('/api/account/profile')
    .send({ mail })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.mail, mail)

  r = await request
    .put('/api/account/profile')
    .send({ mail: '' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.mail, '')
})

test.skip('Update user with privilege remains unchanged', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ privilege: UserPrivilege.User })
  t.is(r.status, 200)
})

test.skip('Update user with privilege up to admin', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ privilege: UserPrivilege.Admin })
  t.is(r.status, 403)
})

test.skip('Update user with privilege up to root', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ privilege: UserPrivilege.Root })
  t.is(r.status, 403)
})

test.skip('Update user with new pwd not valid (too short)', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ oldPwd: pwd, newPwd: 'Aa@12' })
  t.is(r.status, 400)
})

test.skip('Update user with new pwd not valid (too simple)', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ oldPwd: pwd, newPwd: '12345678' })
  t.is(r.status, 400)
})

test.skip('Update user with wrong old pwd', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ oldPwd: `${pwd}7`, newPwd })
  t.is(r.status, 400)
})

test.after.skip('Update user\'s pwd then check', async (t) => {
  let r = await request
    .put(`/api/users/${uid}`)
    .send({ oldPwd: pwd, newPwd })
  t.is(r.status, 200)

  r = await request
    .put(`/api/users/${uid}`)
  t.is(r.status, 401)

  r = await request
    .post('/api/account/login')
    .send({ username: uid, password: await encryptData(newPwd) })
  t.is(r.status, 200)

  r = await request
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.uid, uid)
})

test.after.always('close server', () => {
  server.close()
})
