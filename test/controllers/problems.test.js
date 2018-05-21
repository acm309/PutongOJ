const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')
const meta = require('../meta')

const server = app.listen()
const request = supertest.agent(server)

test('Problem list', async t => {
  const res = await request
    .get('/api/problem/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list.docs))

  if (res.body.list.docs.length > 0) {
    t.truthy(res.body.list.docs[0].title)
    t.truthy(res.body.list.docs[0].pid)
    t.truthy(res.body.list.docs[0].time)
  }
})

test('Problem 1000', async t => {
  const res = await request
    .get('/api/problem/1000')
  
  t.is(res.status, 200)    
  for (const [key, value] of Object.entries(meta.problems[1000])) {
    t.deepEqual(res.body.problem[key], value)
  }
})

test('Problem should fail to find one', async (t) => {
  const res = await request
    .get('/api/problem/10000')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
