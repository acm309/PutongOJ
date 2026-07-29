import path from 'node:path'
import test from 'ava'
import fse from 'fs-extra'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy, status } from '../../../src/utils/constants'

const server = app.listen()
const adminRequest = supertest.agent(server)
const userRequest = supertest.agent(server)

let reservedPid: number | null = null
let availablePid: number | null = null
let availableTestcaseUuid: string | null = null

test.before('login as admin and regular user', async (t) => {
  const adminLogin = await adminRequest.post('/api/account/login').send({
    username: 'admin',
    password: await encryptData(deploy.adminInitPwd),
  })
  t.is(adminLogin.status, 200)

  const userLogin = await userRequest.post('/api/account/login').send({
    username: 'primaryuser',
    password: await encryptData('testtest'),
  })
  t.is(userLogin.status, 200)
})

test.before('create reserved and available problems', async (t) => {
  const reserved = await adminRequest.post('/api/problem').send({
    title: 'Testcase Authorization Reserved Problem',
    description: 'Used for hidden problem authorization checks.',
    input: 'Input',
    output: 'Output',
    in: '1',
    out: '1',
  })

  t.is(reserved.status, 200)
  t.truthy(reserved.body.pid)
  reservedPid = reserved.body.pid

  const available = await adminRequest.post('/api/problem').send({
    title: 'Testcase Authorization Available Problem',
    description: 'Used for non-owner authorization checks.',
    input: 'Input',
    output: 'Output',
    in: '1 2',
    out: '3',
    status: status.Available,
  })

  t.is(available.status, 200)
  t.truthy(available.body.pid)
  availablePid = available.body.pid

  const created = await adminRequest
    .post(`/api/problem/${availablePid}/testcases`)
    .send({ in: 'secret input data', out: 'secret output data' })

  t.is(created.status, 200)
  t.true(Array.isArray(created.body.data))
  t.is(created.body.data.length, 1)
  availableTestcaseUuid = created.body.data[0].uuid
})

test('Regular user can view available problem metadata', async (t) => {
  const res = await userRequest.get(`/api/problem/${availablePid}`)

  t.is(res.status, 200)
  t.truthy(res.body.pid ?? res.body.title)
})

test('List testcases on reserved problem is denied with 404', async (t) => {
  const res = await userRequest.get(`/api/problem/${reservedPid}/testcases`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Create testcase on reserved problem is denied with 404', async (t) => {
  const res = await userRequest
    .post(`/api/problem/${reservedPid}/testcases`)
    .send({ in: '1 2\n', out: '3\n' })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Export testcases on reserved problem is denied with 404', async (t) => {
  const res = await userRequest.get(`/api/problem/${reservedPid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Get testcase content on reserved problem is denied with 404', async (t) => {
  t.truthy(availableTestcaseUuid)
  const res = await userRequest.get(
    `/api/problem/${reservedPid}/testcases/${availableTestcaseUuid}.in`,
  )

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Remove testcase on reserved problem is denied with 404', async (t) => {
  t.truthy(availableTestcaseUuid)
  const res = await userRequest.delete(
    `/api/problem/${reservedPid}/testcases/${availableTestcaseUuid}`,
  )

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('List testcases on available problem is denied with 403 for non-owner', async (t) => {
  const res = await userRequest.get(`/api/problem/${availablePid}/testcases`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Create testcase on available problem is denied with 403 for non-owner', async (t) => {
  const res = await userRequest
    .post(`/api/problem/${availablePid}/testcases`)
    .send({ in: 'foo\n', out: 'bar\n' })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Export testcases on available problem is denied with 403 for non-owner', async (t) => {
  const res = await userRequest.get(`/api/problem/${availablePid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Get testcase content on available problem is denied with 403 for non-owner', async (t) => {
  t.truthy(availableTestcaseUuid)
  const res = await userRequest.get(
    `/api/problem/${availablePid}/testcases/${availableTestcaseUuid}.in`,
  )

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Get testcase output on available problem is denied with 403 for non-owner', async (t) => {
  t.truthy(availableTestcaseUuid)
  const res = await userRequest.get(
    `/api/problem/${availablePid}/testcases/${availableTestcaseUuid}.out`,
  )

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Remove testcase on available problem is denied with 403 for non-owner', async (t) => {
  t.truthy(availableTestcaseUuid)
  const res = await userRequest.delete(
    `/api/problem/${availablePid}/testcases/${availableTestcaseUuid}`,
  )

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Admin can still export testcases', async (t) => {
  const res = await adminRequest.get(`/api/problem/${availablePid}/testcases/export`)

  t.is(res.status, 200)
  t.is(res.type, 'application/zip')
})

test('Admin can still get testcase content', async (t) => {
  t.truthy(availableTestcaseUuid)
  const res = await adminRequest.get(
    `/api/problem/${availablePid}/testcases/${availableTestcaseUuid}.in`,
  )

  t.is(res.status, 200)
  t.is(res.type, 'text/plain')
  t.is(res.text, 'secret input data')
})

test.after.always('cleanup', async () => {
  if (reservedPid) {
    await adminRequest.delete(`/api/problem/${reservedPid}`)

    const reservedDir = path.resolve(__dirname, `../../../data/${reservedPid}`)
    if (fse.existsSync(reservedDir)) {
      await fse.remove(reservedDir)
    }
  }
  if (availablePid) {
    await adminRequest.delete(`/api/problem/${availablePid}`)

    const testDir = path.resolve(__dirname, `../../../data/${availablePid}`)
    if (fse.existsSync(testDir)) {
      await fse.remove(testDir)
    }
  }

  server.close()
})
