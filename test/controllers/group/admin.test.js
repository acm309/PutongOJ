const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
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

test.serial('create new group', async t => {
  const create = await request
    .post('/api/group')
    .send({
      title: '测试组2',
      list: [ 'admin' ]
    })

  t.is(create.status, 200)
})

test.serial('Update Group 2', async t => {
  const update = await request
    .put('/api/group/2')
    .send({
      title: '测试组更新2',
      list: [ 'admin' ]
    })
  t.is(update.status, 200)

  const find = await request
    .get('/api/group/2')

  t.is(find.status, 200)
  t.is(find.body.group.title, '测试组更新2')
  t.deepEqual(find.body.group.list, [ 'admin' ])

  const user = await request
    .get('/api/user/admin')

  t.true(user.body.user.gid.includes(2))
})

test.serial('Delete Group 2', async t => {
  const update = await request
    .delete('/api/group/2')
  t.is(update.status, 200)

  const find = await request
    .get('/api/group/2')

  t.is(find.status, 400)

  const user = await request
    .get('/api/user/admin')

  t.false(user.body.user.gid.includes(2))
})
