const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')

const server = app.listen()
const request = supertest.agent(server)

test('User list', async t => {
  const res = await request
    .get('/api/user/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list))

  if (res.body.list.length > 0) {
    t.truthy(res.body.list[0].uid)
    t.truthy(res.body.list[0].nick)
  }
})

test.serial('create a new user', async t => {
  let res = await request
    .post('/api/user')
    .send({
      uid: 'test',
      pwd: '123456',
      nick: '1234'
    })

  t.is(res.status, 200)
  t.is(res.type, 'application/json')

  res = await request
    .post('/api/session')
    .send({
      uid: 'test',
      pwd: '123456'
    })
  t.is(res.status, 200)
})

test.serial("can not update other user's info", async t => {
  const res = await request
    .put('/api/user/admin')
    .send({
      nick: 'asdfgh'
    })

  t.is(res.status, 400)
})

test.serial('can update user info', async t => {
  const res = await request
    .put('/api/user/test')
    .send({
      nick: 'new nick name'
    })

  t.is(res.status, 200)
})

test('User Find One', async t => {
  const res = await request
    .get('/api/user/test')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.is(res.body.user.uid, 'test')
  t.is(res.body.user.nick, 'new nick name')

  // no secret info
  t.falsy(res.body.user.pwd)
})

test('User should fail to find one', async t => {
  const res = await request
    .get('/api/user/notexist')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')
  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
