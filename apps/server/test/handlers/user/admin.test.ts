import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
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
      username: userRoot.username,
      password: await encryptData(userRoot.pwd!),
    })
  t.is(r.status, 200)

  r = await requestRoot
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.username, userRoot.username)
  t.is(r.body.data.privilege, 'ROOT')
})

test.skip('Fetch user list filter by privilege', async (t) => {
  const r = await requestRoot
    .get('/api/users/list?privilege=admin')
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.items))
  t.true(r.body.items.length > 0)
  const u = r.body.items[0]
  t.is(typeof u.username, 'string')
  t.is(typeof u.privilege, 'number')
  t.true([ 'ADMIN', 'ROOT' ].includes(u.privilege))
})

test.skip('Fetch user list filter by uid', async (t) => {
  const r = await requestRoot
    .get(`/api/users/list?type=uid&content=${userPrimary.username}`)
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.items))
  t.is(r.body.items.length, 1)
  const u = r.body.items[0]
  t.is(u.username, userPrimary.username)
})

test('Update admin self\'s privilege', async (t) => {
  const r = await requestRoot
    .put(`/api/admin/users/${userRoot.username}`)
    .send({ privilege: 'USER' })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test.serial('Update user privilege to admin with root privilege', async (t) => {
  let r = await requestRoot
    .put(`/api/admin/users/${userAdmin.username}`)
    .send({ privilege: 'ADMIN' })
  t.is(r.status, 200)
  t.true(r.body.success)

  r = await requestAdmin
    .post('/api/account/login')
    .send({
      username: userAdmin.username,
      password: await encryptData(userAdmin.pwd!),
    })
  t.is(r.status, 200)

  r = await requestAdmin
    .get('/api/account/profile')
  t.is(r.status, 200)
  t.true(r.body.success)
  t.is(r.body.data.username, userAdmin.username)
  t.is(r.body.data.privilege, 'ADMIN')
})

test.serial('Update user privilege with admin privilege', async (t) => {
  const r = await requestAdmin
    .put(`/api/admin/users/${userRoot.username}`)
    .send({ privilege: 'USER' })
  t.is(r.status, 200)
  t.false(r.body.success)
})

test.serial('Update other user\'s info with admin privilege', async (t) => {
  const r = await requestAdmin
    .put(`/api/admin/users/${userPrimary.username}`)
    .send({ motto: 'test' })
  t.is(r.status, 200)
  t.true(r.body.success)

  const r2 = await requestAdmin
    .get(`/api/users/${userPrimary.username}`)
  t.is(r2.status, 200)
  t.is(r2.body.data.motto, 'test')
})

test.after.always('close server', () => {
  server.close()
})
