import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'

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
  t.is(r.body.data.username, uid)
  t.is(r.body.data.privilege, 'USER')
})

test('Update user with nick not valid (too long)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ nickname: 'a'.repeat(31) })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user\'s nick then clear', async (t) => {
  let r = await request
    .put('/api/account/profile')
    .send({ nickname: 'test20424' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.nickname, 'test20424')

  r = await request
    .put('/api/account/profile')
    .send({ nickname: '' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.nickname, '')
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
    .send({ email: 'a'.repeat(255) })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user with mail not valid (invalid email)', async (t) => {
  const r = await request
    .put('/api/account/profile')
    .send({ email: 'test' })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test('Update user\'s mail then clear', async (t) => {
  let r = await request
    .put('/api/account/profile')
    .send({ email: mail })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.email, mail)

  r = await request
    .put('/api/account/profile')
    .send({ email: '' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await request
    .get(`/api/users/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.data.email, '')
})

test.skip('Update user with privilege remains unchanged', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ privilege: 'USER' })
  t.is(r.status, 200)
})

test.skip('Update user with privilege up to admin', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ privilege: 'ADMIN' })
  t.is(r.status, 403)
})

test.skip('Update user with privilege up to root', async (t) => {
  const r = await request
    .put(`/api/users/${uid}`)
    .send({ privilege: 'ROOT' })
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
  t.is(r.body.data.username, uid)
})

test.after.always('close server', () => {
  server.close()
})
