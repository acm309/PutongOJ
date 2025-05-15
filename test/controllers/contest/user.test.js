const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')
// const config = require('../../../config')

const server = app.listen()
const request = supertest.agent(server)
const user = users.data.primaryuser

test.before('Login', async (t) => {
  const login = await request
    .post('/api/session')
    .send({
      uid: user.uid,
      pwd: user.pwd,
    })

  t.is(login.status, 200)
})

test('Find contest 1', async (t) => {
  const find = await request
    .get('/api/contest/1')

  t.is(find.status, 200)
  t.is(find.type, 'application/json')
  t.truthy(find.body.contest)
  t.truthy(find.body.overview)
  t.truthy(Array.isArray(find.body.solved))
  t.truthy(find.body.totalProblems)
})

test('Can not find non-existent contest', async (t) => {
  const find = await request
    .get('/api/contest/-1')

  t.is(find.status, 400)
  t.is(find.type, 'application/json')

  t.truthy(find.body.error)
})

test('Can not enter contest that have not started', async (t) => {
  const find = await request
    .get('/api/contest/5')

  t.is(find.status, 400)
  t.is(find.type, 'application/json')

  t.truthy(find.body.error)
})

test('Can enter private contest of groups', async (t) => {
  const verify = await request
    .post('/api/contest/6/verify')
    .send({
      cid: 6,
    })

  t.is(verify.status, 200, verify.body.error)
  t.true(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test('Can not enter private contest of groups', async (t) => {
  const verify = await request
    .post('/api/contest/7/verify')
    .send({
      cid: 7,
    })

  t.is(verify.status, 200, verify.body.error)
  t.false(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test('Can enter the private contest because of authorization', async (t) => {
  const verify = await request
    .post('/api/contest/2/verify')
    .send({
      cid: 2,
    })

  t.is(verify.status, 200)
  t.true(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test('Can not enter the private contest because of no authorization', async (t) => {
  const verify = await request
    .post('/api/contest/2/verify')
    .send({
      cid: 4,
    })

  t.is(verify.status, 200)
  t.false(verify.body.isVerify)
  t.truthy(verify.body.profile)
})

test('Can not enter the contest because of wrong password', async (t) => {
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

test('Can enter the contest because of right password', async (t) => {
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

test('Find ranklist for contest 1', async (t) => {
  const rank = await request
    .get('/api/contest/1/ranklist')

  t.is(rank.status, 200)
  t.is(rank.type, 'application/json')
  t.truthy(rank.body.ranklist)
})

test.after.always('close server', () => {
  server.close()
})
