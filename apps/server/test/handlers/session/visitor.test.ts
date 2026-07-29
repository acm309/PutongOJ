import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

test('Bannded user login', async (t) => {
  const res = await request
    .post('/api/account/login')
    .send({
      username: userSeeds.banned.uid,
      password: await encryptData(userSeeds.banned.pwd!),
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Non-exist user login', async (t) => {
  const res = await request
    .post('/api/account/login')
    .send({
      username: 'non-exist',
      password: await encryptData('non-exist'),
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Wrong password login', async (t) => {
  const res = await request
    .post('/api/account/login')
    .send({
      username: userSeeds.admin.uid,
      password: await encryptData('wrong-password'),
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Get session profile without login', async (t) => {
  const res = await request
    .get('/api/account/profile')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.data, null)
})

test.after.always('close server', () => {
  server.close()
})
