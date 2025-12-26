import path from 'node:path'
import test from 'ava'
import fse from 'fs-extra'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)

// Test variables to track created resources
let testPid: number | null = null
let testcaseUuid: string | null = null

test.before('Login as admin', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(config.deploy.adminInitPwd),
    })

  t.is(login.status, 200)
})

test.before('Create a test problem', async (t) => {
  const create = await request
    .post('/api/problem')
    .send({
      title: 'Test Problem for Testcases',
      description: 'A problem to test testcase operations',
      input: 'Test input description',
      output: 'Test output description',
      in: '1 2',
      out: '3',
    })

  t.is(create.status, 200)
  t.truthy(create.body.pid)
  testPid = create.body.pid
})

test.serial('Find testcases - should return empty array initially', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 0)
})

test.serial('Create testcase - should succeed with valid input and output', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({
      in: '1 2\n',
      out: '3\n',
    })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 1)
  t.truthy(res.body.data[0].uuid)

  // Store UUID for later tests
  testcaseUuid = res.body.data[0].uuid

  // Verify the testcase files were created
  const testDir = path.resolve(__dirname, `../../../data/${testPid}`)
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.in`)))
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.out`)))
})

test.serial('Create testcase - should fail without both input and output', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({
      in: '',
      out: '',
    })

  t.is(res.status, 400)
})

test.serial('Find testcases - should return created testcase', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 1)
  t.is(res.body.data[0].uuid, testcaseUuid)
})

test.serial('Get testcase input file - should return input content', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${testcaseUuid}.in`)

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '1 2\n')
})

test.serial('Get testcase output file - should return output content', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${testcaseUuid}.out`)

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '3\n')
})

test.serial('Get testcase - should fail with invalid type', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${testcaseUuid}.txt`)

  t.is(res.status, 400)
})

test.serial('Get testcase - should fail with invalid UUID', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/invalid-uuid.in`)

  t.is(res.status, 400)
})

test.serial('Get testcase - should fail with non-existent UUID', async (t) => {
  const nonExistentUuid = '00000000-0000-0000-0000-000000000000'
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${nonExistentUuid}.in`)

  t.is(res.status, 400)
})

test.serial('Export testcases - should return zip file', async (t) => {
  const res = await request
    .get(`/api/problem/${testPid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.type, 'application/zip')
  t.truthy(res.header['content-disposition'])
  t.true(res.header['content-disposition'].includes('attachment'))
  t.true(res.header['content-disposition'].includes('.zip'))
  t.truthy(res.body)
})

test.serial('Create multiple testcases - should return all testcases', async (t) => {
  const res1 = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({
      in: '5 10\n',
      out: '15\n',
    })

  t.is(res1.status, 200)
  t.true(res1.body.success)
  t.is(res1.body.data.length, 2)

  const res2 = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({
      in: '100 200\n',
      out: '300\n',
    })

  t.is(res2.status, 200)
  t.true(res2.body.success)
  t.is(res2.body.data.length, 3)
})

test.serial('Remove testcase - should succeed with valid UUID', async (t) => {
  const res = await request
    .delete(`/api/problem/${testPid}/testcases/${testcaseUuid}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 2) // Should have 2 remaining testcases

  // Verify the UUID is not in the returned list
  const uuids = res.body.data.map((tc: any) => tc.uuid)
  t.false(uuids.includes(testcaseUuid))

  // Verify files still exist (they should not be deleted)
  const testDir = path.resolve(__dirname, `../../../data/${testPid}`)
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.in`)))
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.out`)))
})

test.serial('Remove testcase - should fail with invalid UUID format', async (t) => {
  const res = await request
    .delete(`/api/problem/${testPid}/testcases/invalid-uuid`)

  t.is(res.status, 400)
})

test.after.always('Cleanup', async (_t) => {
  // Clean up test problem and data directory
  if (testPid) {
    await request.delete(`/api/problem/${testPid}`)

    const testDir = path.resolve(__dirname, `../../../data/${testPid}`)
    if (fse.existsSync(testDir)) {
      await fse.remove(testDir)
    }
  }

  server.close()
})
