const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')

const server = app.listen()
const request = supertest.agent(server)

test('Problem list', async t => {
  const res = await request
    .get('/api/problem/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
})

test.after.always('close server', t => {
  server.close()
})
