import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

// Use an existing seed problem for endpoint accessibility checks.
const testPid = 1000
const dummyUuid = '00000000-0000-0000-0000-000000000000'

test('List testcases requires login', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Create testcase requires login', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({ in: '1 2\n', out: '3\n' })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Export testcases requires login', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Get testcase content requires login', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/${dummyUuid}.in`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Remove testcase requires login', async (t) => {
  const res = await request.delete(`/api/problem/${testPid}/testcases/${dummyUuid}`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
