import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)
const user = userSeeds.primaryuser

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: user.uid,
      password: await encryptData(user.pwd!),
    })

  t.is(login.status, 200)
})

test.skip('Find contest 1', async (t) => {
  const find = await request
    .get('/api/contest/1')

  t.is(find.status, 200)
  t.is(find.type, 'application/json')
  t.truthy(find.body.contest)
  t.truthy(find.body.overview)
  t.truthy(Array.isArray(find.body.solved))
  t.truthy(find.body.totalProblems)
})

test.skip('Can not find non-existent contest', async (t) => {
  const find = await request
    .get('/api/contest/-1')

  t.is(find.status, 400)
  t.is(find.type, 'application/json')

  t.truthy(find.body.error)
})

test.skip('Can not enter contest that have not started', async (t) => {
  const find = await request
    .get('/api/contest/5')

  t.is(find.status, 400)
  t.is(find.type, 'application/json')

  t.truthy(find.body.error)
})

test.skip('Can enter private contest of groups', async (t) => {
  const verify = await request
    .post('/api/contest/6/verify')
    .send({
      cid: 6,
    })

  t.is(verify.status, 200, verify.body.error)
  t.true(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test.skip('Can not enter private contest of groups', async (t) => {
  const verify = await request
    .post('/api/contest/7/verify')
    .send({
      cid: 7,
    })

  t.is(verify.status, 200, verify.body.error)
  t.false(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test.skip('Can enter the private contest because of authorization', async (t) => {
  const verify = await request
    .post('/api/contest/2/verify')
    .send({
      cid: 2,
    })

  t.is(verify.status, 200)
  t.true(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test.skip('Can not enter the private contest because of no authorization', async (t) => {
  const verify = await request
    .post('/api/contest/2/verify')
    .send({
      cid: 4,
    })

  t.is(verify.status, 200)
  t.false(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test.skip('Can not enter the contest because of wrong password', async (t) => {
  const res1 = await request
    .post('/api/contest/3/verify')
    .send({
      cid: 3,
      pwd: '000000',
    })

  t.is(res1.status, 200)
  t.false(res1.body.isVerify)
  t.truthy(res1.body.profile)
})

test.skip('Can enter the contest because of right password', async (t) => {
  const res1 = await request
    .post('/api/contest/3/verify')
    .send({
      cid: 3,
      pwd: '123456',
    })

  t.is(res1.status, 200)
  t.true(res1.body.isVerify)
  t.truthy(res1.body.profile)
})

test.skip('Find ranklist for contest 1', async (t) => {
  const rank = await request
    .get('/api/contest/1/ranklist')

  t.is(rank.status, 200)
  t.is(rank.type, 'application/json')
  t.truthy(rank.body.ranklist)
})

test.after.always('close server', () => {
  server.close()
})
