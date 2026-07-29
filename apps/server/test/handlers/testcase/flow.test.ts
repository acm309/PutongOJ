import { randomUUID } from 'node:crypto'
import path from 'node:path'
import test from 'ava'
import fse from 'fs-extra'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'

const server = app.listen()
const request = supertest.agent(server)

let testPid: number | null = null
let testcaseUuid: string | null = null

test.before('login as admin', async (t) => {
  const login = await request.post('/api/account/login').send({
    username: 'admin',
    password: await encryptData(deploy.adminInitPwd),
  })

  t.is(login.status, 200)
})

test.before('create test problem', async (t) => {
  const created = await request.post('/api/problem').send({
    title: 'Testcase Lifecycle Problem',
    description: 'Used to validate testcase CRUD and file behaviors.',
    input: 'Input description',
    output: 'Output description',
    in: '1 2',
    out: '3',
  })

  t.is(created.status, 200)
  t.truthy(created.body.pid)
  testPid = created.body.pid
})

test.serial('List is empty initially', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 0)
})

test.serial('Create testcase succeeds with valid in/out', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({ in: '1 2\n', out: '3\n' })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 1)
  t.truthy(res.body.data[0].uuid)

  testcaseUuid = res.body.data[0].uuid

  const testDir = path.resolve(__dirname, `../../../data/${testPid}`)
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.in`)))
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.out`)))
})

test.serial('Create testcase fails with empty in/out', async (t) => {
  const res = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({ in: '', out: '' })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.serial('List returns created testcase', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 1)
  t.is(res.body.data[0].uuid, testcaseUuid)
})

test.serial('Get testcase input content', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/${testcaseUuid}.in`)

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '1 2\n')
})

test.serial('Get testcase output content', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/${testcaseUuid}.out`)

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, '3\n')
})

test.serial('Get testcase fails with invalid file type', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/${testcaseUuid}.txt`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.serial('Get testcase fails with invalid uuid format', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/invalid-uuid.in`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.serial('Get testcase fails with non-existent uuid', async (t) => {
  const nonExistentUuid = randomUUID()
  const res = await request
    .get(`/api/problem/${testPid}/testcases/${nonExistentUuid}.in`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.serial('Export returns zip archive', async (t) => {
  const res = await request.get(`/api/problem/${testPid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.type, 'application/zip')
  t.truthy(res.header['content-disposition'])
  t.true(res.header['content-disposition'].includes('attachment'))
  t.true(res.header['content-disposition'].includes('.zip'))
  t.truthy(res.body)
})

test.serial('Creating multiple testcases returns cumulative list', async (t) => {
  const res1 = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({ in: '5 10\n', out: '15\n' })

  t.is(res1.status, 200)
  t.true(res1.body.success)
  t.is(res1.body.data.length, 2)

  const res2 = await request
    .post(`/api/problem/${testPid}/testcases`)
    .send({ in: '100 200\n', out: '300\n' })

  t.is(res2.status, 200)
  t.true(res2.body.success)
  t.is(res2.body.data.length, 3)
})

test.serial('Remove testcase succeeds with valid uuid', async (t) => {
  const res = await request.delete(`/api/problem/${testPid}/testcases/${testcaseUuid}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
  t.is(res.body.data.length, 2)

  const uuids = res.body.data.map((tc: any) => tc.uuid)
  t.false(uuids.includes(testcaseUuid))

  const testDir = path.resolve(__dirname, `../../../data/${testPid}`)
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.in`)))
  t.true(fse.existsSync(path.resolve(testDir, `${testcaseUuid}.out`)))
})

test.serial('Remove testcase fails with invalid uuid format', async (t) => {
  const res = await request.delete(`/api/problem/${testPid}/testcases/invalid-uuid`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.after.always('cleanup', async () => {
  if (testPid) {
    await request.delete(`/api/problem/${testPid}`)

    const testDir = path.resolve(__dirname, `../../../data/${testPid}`)
    if (fse.existsSync(testDir)) {
      await fse.remove(testDir)
    }
  }

  server.close()
})
