import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

const user = userSeeds.ugordon

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: user.uid,
      password: await encryptData(user.pwd!),
    })

  t.is(login.status, 200)
})

// 1004: reserved
test('Normal user can not visit reserved problem', async (t) => {
  const res = await request
    .get('/api/problem/1004')

  t.is(res.status, 404)
})

test('Query problem list', async (t) => {
  const res = await request
    .get('/api/problem')

  t.is(res.status, 200)
  t.true(Array.isArray(res.body.list.docs))
  t.is(res.body.list.docs.length, res.body.list.total)
  t.truthy(Array.isArray(res.body.solved))
})

test('Statistics for pid 1001', async (t) => {
  const res = await request
    .get('/api/problem/1001/statistics')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list.docs))
  t.truthy(Array.isArray(res.body.group))
})

test.after.always('close server', () => {
  server.close()
})
