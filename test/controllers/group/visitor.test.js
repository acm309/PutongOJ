const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const meta = require('../../meta')

const server = app.listen()
const request = supertest.agent(server)

test('Group list', async t => {
  const res = await request
    .get('/api/group/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list))
})

test('Find Group 1', async t => {
  const res = await request
    .get('/api/group/1')

  t.is(res.status, 200)
  for (const [key, value] of Object.entries(meta.groups[1])) {
    t.deepEqual(res.body.group[key], value)
  }
})

test('Group should fail to find one', async (t) => {
  const res = await request
    .get('/api/group/10000')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
