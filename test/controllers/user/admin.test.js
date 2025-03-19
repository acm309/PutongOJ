const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const config = require('../../../config')
const users = require('../../seed/users')

const server = app.listen()
const requestRoot = supertest.agent(server)
const requestAdmin = supertest.agent(server)

const userRoot = users.data.admin
const userAdmin = users.data.toelevate
const userPrimary = users.data.primaryuser

test.before('Login as admin', async (t) => {
  let r = await requestRoot
    .post('/api/session')
    .send({ uid: userRoot.uid, pwd: userRoot.pwd })
  t.is(r.status, 200)

  r = await requestRoot
    .get('/api/session')
  t.is(r.status, 200)
  t.is(r.body.profile.uid, userRoot.uid)
  t.is(r.body.profile.privilege, config.privilege.Root)
})

test('Fetch user list filter by privilege', async (t) => {
  const r = await requestRoot
    .get('/api/user/list?privilege=admin')
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.true(r.body.docs.length > 0)
  const u = r.body.docs[0]
  t.is(typeof u.uid, 'string')
  t.is(typeof u.privilege, 'number')
  t.true([ config.privilege.Admin, config.privilege.Root ].includes(u.privilege))
})

test('Fetch user list filter by uid', async (t) => {
  const r = await requestRoot
    .get(`/api/user/list?type=uid&content=${userRoot.uid}`)
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.is(r.body.docs.length, 1)
  const u = r.body.docs[0]
  t.is(u.uid, userRoot.uid)
})

test('Update admin self\'s privilege', async (t) => {
  const r = await requestRoot
    .put(`/api/user/${userRoot.uid}`)
    .send({ privilege: config.privilege.User })
  t.is(r.status, 403)
})

test.serial('Update user privilege to admin with root privilege', async (t) => {
  let r = await requestRoot
    .put(`/api/user/${userAdmin.uid}`)
    .send({ privilege: config.privilege.Admin })
  t.is(r.status, 200)

  r = await requestAdmin
    .post('/api/session')
    .send({ uid: userAdmin.uid, pwd: userAdmin.pwd })
  t.is(r.status, 200)

  r = await requestAdmin
    .get('/api/session')
  t.is(r.status, 200)
  t.is(r.body.profile.uid, userAdmin.uid)
  t.is(r.body.profile.privilege, config.privilege.Admin)
})

test.serial('Update user privilege with admin privilege', async (t) => {
  const r = await requestAdmin
    .put(`/api/user/${userRoot.uid}`)
    .send({ privilege: config.privilege.User })
  t.is(r.status, 403)
})

test.serial('Update other user\'s info with admin privilege', async (t) => {
  const r = await requestAdmin
    .put(`/api/user/${userPrimary.uid}`)
    .send({ motto: 'test' })
  t.is(r.status, 200)

  const r2 = await requestAdmin
    .get(`/api/user/${userPrimary.uid}`)
  t.is(r2.status, 200)
  t.is(r2.body.user.motto, 'test')
})

test.after.always('close server', () => {
  server.close()
})
