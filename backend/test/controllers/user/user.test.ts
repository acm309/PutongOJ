import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)

const uid = 'test18315'
const pwd = 'Aa@123456'
const newPwd = 'Aa@654321'
const mail = 'account@example.com'

test.before('Create user and login', async (t) => {
  let r = await request
    .post('/api/user')
    .send({ uid, pwd: await encryptData(pwd) })
  t.is(r.status, 200)

  r = await request
    .post('/api/session')
    .send({ uid, pwd: await encryptData(pwd) })
  t.is(r.status, 200)

  r = await request
    .get('/api/session')
  t.is(r.status, 200)
  t.is(r.body.profile.uid, uid)
  t.is(r.body.profile.privilege, config.privilege.User)
})

test('Update other\'s profile', async (t) => {
  const r = await request
    .put('/api/user/admin')
    .send({ nick: 'failed' })
  t.is(r.status, 403)
})

test('Update user with nick not valid (too long)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ nick: 'a'.repeat(31) })
  t.is(r.status, 400)
})

test('Update user\'s nick then clear', async (t) => {
  let r = await request
    .put(`/api/user/${uid}`)
    .send({ nick: 'test20424' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.nick, 'test20424')

  r = await request
    .put(`/api/user/${uid}`)
    .send({ nick: '' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.nick, '')
})

test('Update user with motto not valid (too long)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ motto: 'a'.repeat(301) })
  t.is(r.status, 400)
})

test('Update user\'s motto then clear', async (t) => {
  let r = await request
    .put(`/api/user/${uid}`)
    .send({ motto: 'test19025' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.motto, 'test19025')

  r = await request
    .put(`/api/user/${uid}`)
    .send({ motto: '' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.motto, '')
})

test('Update user with school not valid (too long)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ school: 'a'.repeat(31) })
  t.is(r.status, 400)
})

test('Update user\'s school then clear', async (t) => {
  let r = await request
    .put(`/api/user/${uid}`)
    .send({ school: 'test31975' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.school, 'test31975')

  r = await request
    .put(`/api/user/${uid}`)
    .send({ school: '' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.school, '')
})

test('Update user with mail not valid (too long)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ mail: 'a'.repeat(255) })
  t.is(r.status, 400)
})

test('Update user with mail not valid (invalid email)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ mail: 'test' })
  t.is(r.status, 400)
})

test('Update user\'s mail then clear', async (t) => {
  let r = await request
    .put(`/api/user/${uid}`)
    .send({ mail })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.mail, mail)

  r = await request
    .put(`/api/user/${uid}`)
    .send({ mail: '' })
  t.is(r.status, 200)

  r = await request
    .get(`/api/user/${uid}`)
  t.is(r.status, 200)
  t.is(r.body.user.mail, '')
})

test('Update user with privilege remains unchanged', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ privilege: config.privilege.User })
  t.is(r.status, 200)
})

test('Update user with privilege up to admin', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ privilege: config.privilege.Admin })
  t.is(r.status, 403)
})

test('Update user with privilege up to root', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ privilege: config.privilege.Root })
  t.is(r.status, 403)
})

test('Update user with new pwd not valid (too short)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ oldPwd: pwd, newPwd: 'Aa@12' })
  t.is(r.status, 400)
})

test('Update user with new pwd not valid (too simple)', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ oldPwd: pwd, newPwd: '12345678' })
  t.is(r.status, 400)
})

test('Update user with wrong old pwd', async (t) => {
  const r = await request
    .put(`/api/user/${uid}`)
    .send({ oldPwd: `${pwd}7`, newPwd })
  t.is(r.status, 400)
})

test.after('Update user\'s pwd then check', async (t) => {
  let r = await request
    .put(`/api/user/${uid}`)
    .send({ oldPwd: pwd, newPwd })
  t.is(r.status, 200)

  r = await request
    .put(`/api/user/${uid}`)
  t.is(r.status, 401)

  r = await request
    .post('/api/session')
    .send({ uid, pwd: await encryptData(newPwd) })
  t.is(r.status, 200)

  r = await request
    .get('/api/session')
  t.is(r.status, 200)
  t.is(r.body.profile.uid, uid)
})

test.after.always('close server', () => {
  server.close()
})
