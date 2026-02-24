import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

// Use an existing problem from seeds (pid: 1000)
const testPid = 1000

test('Find testcases - should require login', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Create testcase - should require login', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({
      in: '1 2\n',
      out: '3\n',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Export testcases - should require login', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Get testcase - should require login', async (t) => {
  const dummyUuid = '00000000-0000-0000-0000-000000000000'
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${dummyUuid}.in`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Remove testcase - should require login', async (t) => {
  const dummyUuid = '00000000-0000-0000-0000-000000000000'
  const res = await request
    .delete(`/api/problem/${testPid}/testcases/${dummyUuid}`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
