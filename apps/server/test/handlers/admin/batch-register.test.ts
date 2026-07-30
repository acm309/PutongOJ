import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()

const requestRoot = supertest.agent(server)
const requestUser = supertest.agent(server)
const requestAnon = supertest.agent(server)
const batchSuffix = Math.random().toString(36).slice(2, 8)
const batchUsername = `bstu${batchSuffix}`
const secondaryBatchUsername = `baux${batchSuffix}`

test.before('Login root and normal user', async (t) => {
  const rootLogin = await requestRoot
    .post('/api/account/login')
    .send({
      username: userSeeds.admin.username,
      password: await encryptData(userSeeds.admin.pwd!),
    })
  t.is(rootLogin.status, 200)
  t.true(rootLogin.body.success)

  const userLogin = await requestUser
    .post('/api/account/login')
    .send({
      username: userSeeds.primaryuser.username,
      password: await encryptData(userSeeds.primaryuser.pwd!),
    })
  t.is(userLogin.status, 200)
  t.true(userLogin.body.success)
})

test('Anonymous cannot access batch register endpoint', async (t) => {
  const res = await requestAnon
    .post('/api/admin/users/batch-register')
    .send([ { username: 'batchanon1', password: 'StrongPwd123' } ])

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test('Non-root user cannot access batch register endpoint', async (t) => {
  const res = await requestUser
    .post('/api/admin/users/batch-register')
    .send([ { username: 'batchuser1', password: 'StrongPwd123' } ])

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 403)
})

test.serial('Root can batch register with mixed valid and invalid users', async (t) => {
  const payload = [
    {
      username: batchUsername,
      password: 'Strongpwd123',
      nickname: 'Batch Student 001',
    },
    { username: secondaryBatchUsername, password: 'Strongpwd456' },
    { username: userSeeds.admin.username, password: 'Strongpwd789' },
    { username: 'batchstu003', password: 'weak' },
  ]

  const res = await requestRoot
    .post('/api/admin/users/batch-register')
    .send(payload)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.total, 4)
  t.is(res.body.data.created, 2)
  t.is(res.body.data.failed, 2)
  t.true(Array.isArray(res.body.data.results))

  const okUser = res.body.data.results.find((r: any) => r.username === batchUsername)
  t.truthy(okUser)
  t.true(okUser.success)

  const failUser = res.body.data.results.find((r: any) => r.username === userSeeds.admin.username)
  t.truthy(failUser)
  t.false(failUser.success)

  const weakPwdUser = res.body.data.results.find((r: any) => r.username === 'batchstu003')
  t.truthy(weakPwdUser)
  t.false(weakPwdUser.success)
})

test.serial('Batch-registered users can login', async (t) => {
  const loginAgent = supertest.agent(server)
  const res = await loginAgent
    .post('/api/account/login')
    .send({
      username: batchUsername,
      password: await encryptData('Strongpwd123'),
    })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Batch-registered user keeps optional profile fields', async (t) => {
  const res = await requestRoot.get(`/api/admin/users/${batchUsername}`)
  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.username, batchUsername)
  t.is(res.body.data.nickname, 'Batch Student 001')
})

test('Batch register rejects invalid payload', async (t) => {
  const res = await requestRoot
    .post('/api/admin/users/batch-register')
    .send([])

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test.after.always('close server', () => {
  server.close()
})
