const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')
const config = require('../../../config')

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd
    })

  t.is(login.status, 200)
})

test('create a new user', async t => {
  const res = await request
    .post('/api/user')
    .send({
      uid: 'testxxx',
      pwd: '123456',
      nick: '1234'
    })

  t.is(res.status, 200)
  t.is(res.type, 'application/json')

  const res2 = await request
    .get('/api/user/testxxx')

  t.is(res2.status, 200)
  t.is(res2.type, 'application/json')
  t.is(res2.body.user.uid, 'testxxx')
  t.is(res2.body.user.nick, '1234')
})

test("can update user's own info", async t => {
  const user = Object.values(users.data)[5]
  const res = await request
    .put(`/api/user/${user.uid}`)
    .send({
      nick: 'new nick name'
    })

  t.is(res.status, 200)

  const find = await request
    .get(`/api/user/${user.uid}`)
    .send({
      nick: 'new nick name'
    })
  t.is(find.body.user.nick, 'new nick name')
})

test('user uid is been used', async t => {
  const user = Object.values(users.data)[10]
  const res = await request
    .post(`/api/user/`)
    .send({
      uid: user.uid,
      pwd: '123456',
      nick: user.nick
    })

  t.is(res.status, 400)
})

test('password is too short', async t => {
  const user = Object.values(users.data)[10]
  const res = await request
    .post(`/api/user/`)
    .send({
      uid: user.uid,
      pwd: '12345',
      nick: user.nick
    })

  t.is(res.status, 400)
})

test.after.always('close server', t => {
  server.close()
})
