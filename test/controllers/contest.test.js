const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')

const server = app.listen()
const request = supertest.agent(server)

test('Contest list', async t => {
  const res = await request
    .get('/api/contest/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list.docs))

  if (res.body.list.docs.length > 0) {
    t.truthy(res.body.list.docs[0].title)
    t.truthy(res.body.list.docs[0].start)
    t.truthy(res.body.list.docs[0].end)
  }
})

test('Contest fails to find one', async (t) => {
  const res = await request
    .get('/api/contest/-1')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
