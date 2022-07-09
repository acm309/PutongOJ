const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')

const server = app.listen()
const request = supertest.agent(server)

test('Can not create solution without login', async (t) => {
  const res = await request
    .post('/api/status')
    .send({
      pid: 1000,
      language: 1,
      code: 'Anything you like',
    })

  t.is(res.status, 401)
})

test('Status list', async (t) => {
  const res = await request
    .get('/api/status/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.true(Array.isArray(res.body.list.docs))

  t.truthy(res.body.list.docs[0].sid)

  // without code
  t.falsy(res.body.list.docs[0].code)
})

test('Can not see solution without login', async (t) => {
  const res = await request
    .get('/api/status/1')

  t.is(res.status, 401)
})

test.after.always('close server', (t) => {
  server.close()
})
