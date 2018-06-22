const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')

const server = app.listen()
const request = supertest.agent(server)

const user = Object.values(users.data)[15]

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: user.uid,
      pwd: user.pwd
    })

  t.is(login.status, 200)
})

// 1005: reserved
test('Normal user can not visit reserved problem', async t => {
  const res = await request
    .get(`/api/problem/1005`)

  t.is(res.status, 400)
})

test('Query problem list', async t => {
  const res = await request
    .get('/api/problem/list')

  t.is(res.status, 200)
  t.true(Array.isArray(res.body.list.docs))
  t.is(res.body.list.docs.length, res.body.list.total)
  t.truthy(Array.isArray(res.body.solved))
})

test.after.always('close server', t => {
  server.close()
})
