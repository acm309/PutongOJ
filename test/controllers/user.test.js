const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')

const server = app.listen()
const request = supertest.agent(server)

test('User list', async t => {
  const res = await request
    .get('/api/user/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
})

test('User Find One', async t => {
  const res = await request
    .get('/api/user/admin')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.is(res.body.user.uid, 'admin')
})

test.after.always('close server', t => {
  server.close()
})
