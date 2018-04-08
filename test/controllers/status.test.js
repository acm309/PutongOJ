const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')

const server = app.listen()
const request = supertest.agent(server)

test('Status list', async t => {
  const res = await request
    .get('/api/status/list')

  t.plan(4)

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.true(Array.isArray(res.body.list.docs))

  if (res.body.list.length > 0) {
    t.truthy(res.body.list.docs[0].sid)
  } else {
    t.pass('Status list is empty')
  }
})

test('Status fails to find one', async (t) => {
  const res = await request
    .get('/api/status/-1')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
