import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const requestRoot = supertest.agent(server)
const requestAdmin = supertest.agent(server)

const userRoot = userSeeds.admin
const userAdmin = userSeeds.toelevate
const userPrimary = userSeeds.primaryuser

test.before('Login as admin', async (t) => {
  let r = await requestRoot
    .post('/api/account/login')
    .send({
      username: userRoot.uid,
      password: await encryptData(userRoot.pwd!),
    })
  t.is(r.status, 200)

  r = await requestRoot
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.uid, userRoot.uid)
  t.is(r.body.data.privilege, config.privilege.Root)
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
    .get(`/api/user/list?type=uid&content=${userPrimary.uid}`)
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.is(r.body.docs.length, 1)
  const u = r.body.docs[0]
  t.is(u.uid, userPrimary.uid)
})

test('Update admin self\'s privilege', async (t) => {
  const r = await requestRoot
    .put(`/api/admin/users/${userRoot.uid}`)
    .send({ privilege: config.privilege.User })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test.serial('Update user privilege to admin with root privilege', async (t) => {
  let r = await requestRoot
    .put(`/api/admin/users/${userAdmin.uid}`)
    .send({ privilege: config.privilege.Admin })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await requestAdmin
    .post('/api/account/login')
    .send({
      username: userAdmin.uid,
      password: await encryptData(userAdmin.pwd!),
    })
  t.is(r.status, 200)

  r = await requestAdmin
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.uid, userAdmin.uid)
  t.is(r.body.data.privilege, config.privilege.Admin)
})

test.serial('Update user privilege with admin privilege', async (t) => {
  const r = await requestAdmin
    .put(`/api/admin/users/${userRoot.uid}`)
    .send({ privilege: config.privilege.User })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test.serial('Update other user\'s info with admin privilege', async (t) => {
  const r = await requestAdmin
    .put(`/api/admin/users/${userPrimary.uid}`)
    .send({ motto: 'test' })
  t.is(r.status, 200)
  t.true(r.body.success)

  const r2 = await requestAdmin
    .get(`/api/user/${userPrimary.uid}`)
  t.is(r2.status, 200)
  t.is(r2.body.data.motto, 'test')
})

test.after.always('close server', () => {
  server.close()
})
