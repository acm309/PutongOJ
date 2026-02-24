import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)
const adminRequest = supertest.agent(server)

let testPid: number | null = null

test.before('Setup - login as admin and create test problem', async (t) => {
  // Login as admin first
  const adminLogin = await adminRequest
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(config.deploy.adminInitPwd),
    })

  t.is(adminLogin.status, 200)

  // Create a problem that regular user won't have access to
  const create = await adminRequest
    .post('/api/problem')
    .send({
      title: 'Test Problem for User Permission Tests',
      description: 'A problem to test user permission denial',
      input: 'Test input',
      output: 'Test output',
      in: '1',
      out: '1',
    })

  t.is(create.status, 200)
  t.truthy(create.body.pid)
  testPid = create.body.pid
})

test.before('Login as regular user', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'primaryuser',
      password: await encryptData('testtest'),
    })

  t.is(login.status, 200)
})

test('Find testcases - should be denied for non-admin/non-owner', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Create testcase - should be denied for non-admin/non-owner', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({
      in: '1 2\n',
      out: '3\n',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Export testcases - should be denied for non-admin/non-owner', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Get testcase - should be denied for non-admin/non-owner', async (t) => {
  const dummyUuid = '00000000-0000-0000-0000-000000000000'
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${dummyUuid}.in`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Remove testcase - should be denied for non-admin/non-owner', async (t) => {
  const dummyUuid = '00000000-0000-0000-0000-000000000000'
  const res = await request
    .delete(`/api/problem/${testPid}/testcases/${dummyUuid}`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.after.always('Cleanup', async (_t) => {
  // Clean up test problem
  if (testPid) {
    await adminRequest.delete(`/api/problem/${testPid}`)
  }

  server.close()
})
