const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')
const users = require('../../seed/users')

const server = app.listen()
const request = supertest.agent(server)

test('Bannded user login', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: users.data.banned.uid,
      pwd: users.data.banned.pwd,
    })

  t.is(res.status, 403)
})

test('Non-exist user login', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: 'non-exist',
      pwd: 'non-exist',
    })

  t.is(res.status, 400)
})

test('Wrong password login', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: users.data.admin.uid,
      pwd: 'wrong-password',
    })

  t.is(res.status, 400)
})

test('Get session profile without login', async (t) => {
  const res = await request
    .get('/api/session')

  t.is(res.status, 200)
  t.is(res.body.profile, null)
})

test.after.always('close server', () => {
  server.close()
})
