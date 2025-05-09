const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')

const server = app.listen()
const request = supertest.agent(server)

test('Discuss list', async (t) => {
  const res = await request
    .get('/api/discuss/list')

  t.is(res.status, 401)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Discuss should fail to find one', async (t) => {
  const res = await request
    .get('/api/discuss/1')

  t.is(res.status, 401)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Login required to create one', async (t) => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: 'test',
    })

  t.is(res.status, 401)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
