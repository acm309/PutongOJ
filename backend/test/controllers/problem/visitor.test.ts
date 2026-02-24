import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { problemSeeds } from '../../seeds/problem'

const server = app.listen()
const request = supertest.agent(server)

test('Problem list', async (t) => {
  const res = await request
    .get('/api/problem')

  t.is(res.status, 200)
  t.truthy(Array.isArray(res.body.list.docs))
  t.truthy(Array.isArray(res.body.solved))

  if (res.body.list.docs.length > 0) {
    t.truthy(res.body.list.docs[0].title)
    t.truthy(res.body.list.docs[0].pid)
  }
})

test('Problem find one', async (t) => {
  const res = await request
    .get('/api/problem/1001')

  t.is(res.status, 200)

  const n = problemSeeds.find(item => item.title === res.body.title)!

  for (const [ key, value ] of Object.entries(n)) {
    t.deepEqual(res.body[key], value)
  }
})

test('Problem should fail to find one', async (t) => {
  const res = await request
    .get('/api/problem/10000')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Pid is not a number', async (t) => {
  const res = await request
    .get('/api/problem/xx')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.after.always('close server', () => {
  server.close()
})
