const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')

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
  const r = await request
    .post('/api/user')
    .send({ uid: users.data.admin.uid, pwd })
  t.is(r.status, 400)
})

test('Create user without uid', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ pwd })
  t.is(r.status, 400)
})

test('Create user with uid not valid (char not allowed)', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ uid: 'admin@', pwd })
  t.is(r.status, 400)
})

test('Create user with uid not valid (too sort)', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ uid: 'hi', pwd })
  t.is(r.status, 400)
})

test('Create user with uid not valid (too long)', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ uid: 'a'.repeat(21), pwd })
  t.is(r.status, 400)
})

test('Create user without pwd', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ uid: 'test20810' })
  t.is(r.status, 400)
})

test('Create user with pwd not valid (too short)', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ uid: 'test17873', pwd: '12345' })
  t.is(r.status, 400)
})

test('Create user with nick not valid (too long)', async (t) => {
  const r = await request
    .post('/api/user')
    .send({ uid: 'test14505', pwd, nick: 'a'.repeat(21) })
  t.is(r.status, 400)
})

test.after.always('close server', () => {
  server.close()
})
