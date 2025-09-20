const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')
const { encryptData } = require('../../../src/services/crypto')
const { userSeeds } = require('../../seeds/user')

const server = app.listen()
const request = supertest.agent(server)

const pwd = 'Aa@123456'

test('View user doesnt exist', async (t) => {
  const r = await request
    .get('/api/user/test23615')
  t.is(r.status, 404)
})

test('Fetch user list', async (t) => {
  const r = await request
    .get('/api/user/list')
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.true(r.body.docs.length > 0)
  const u = r.body.docs[0]
  t.is(typeof u.uid, 'string')
  t.is(typeof u.privilege, 'number')
})

test('Fetch entire user list', async (t) => {
  const r = await request
    .get('/api/user/list?page=-1')
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.true(r.body.docs.length > 0)
  t.is(typeof r.body.total, 'number')
})

test('Create user already exists', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: userSeeds.admin.uid, pwd: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user without uid', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ pwd: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with uid not valid (char not allowed)', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: 'admin@', pwd: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with uid not valid (too sort)', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: 'hi', pwd: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with uid not valid (too long)', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: 'a'.repeat(21), pwd: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user without pwd', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: 'test20810' })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with pwd not valid (too short)', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: 'test17873', pwd: await encryptData('Aa@1') })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with pwd not valid (too simple)', async (t) => {
  const res = await request
    .post('/api/user')
    .send({ uid: 'test28699', pwd: await encryptData('12345678') })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test.after.always('close server', () => {
  server.close()
})
