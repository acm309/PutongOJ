const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')
const { encryptData } = require('../../../src/services/crypto')
const { userSeeds } = require('../../seeds/user')

const server = app.listen()
const request = supertest.agent(server)

test('Bannded user login', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: userSeeds.banned.uid,
      pwd: await encryptData(userSeeds.banned.pwd),
    })

  t.is(res.status, 403)
})

test('Non-exist user login', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: 'non-exist',
      pwd: await encryptData('non-exist'),
    })

  t.is(res.status, 400)
})

test('Wrong password login', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: userSeeds.admin.uid,
      pwd: await encryptData('wrong-password'),
    })

  t.is(res.status, 400)
})

test('Get session profile without login', async (t) => {
  const res = await request
    .get('/api/session')

  t.is(res.status, 200)
  t.is(res.body.profile, null)
})

test.after.always('close server', () => {
  server.close()
})
