const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')
const config = require('../../../src/config')
const { userSeeds } = require('../../seeds/user')

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async (t) => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd,
    })

  t.is(login.status, 200)
})

test.serial('create new group', async (t) => {
  const create = await request
    .post('/api/group')
    .send({
      title: '测试组2',
      list: [ 'admin' ],
    })

  t.is(create.status, 200)
})

test.serial('Update Group 2', async (t) => {
  const update = await request
    .put('/api/group/2')
    .send({
      title: '测试组更新2',
      list: [ 'admin' ],
    })
  t.is(update.status, 200)

  const find = await request
    .get('/api/group/2')

  t.is(find.status, 200)
  t.is(find.body.group.title, '测试组更新2')
  t.deepEqual(find.body.group.list, [ 'admin' ])

  const user = await request
    .get('/api/user/admin')

  t.true(user.body.user.groups.some(group => group.gid === 2))
})

test.serial('Update Group 2 -- update members', async (t) => {
  const user = userSeeds.primaryuser
  const update = await request
    .put('/api/group/2')
    .send({
      title: '测试组更新2',
      list: [ user.uid ],
    })
  t.is(update.status, 200)

  const find = await request
    .get('/api/group/2')

  t.is(find.status, 200)
  t.is(find.body.group.title, '测试组更新2')
  t.deepEqual(find.body.group.list, [ user.uid ])

  let r = await request
    .get('/api/user/admin')

  t.false(r.body.user.groups.some(group => group.gid === 2))

  r = await request
    .get(`/api/user/${user.uid}`)

  t.true(r.body.user.groups.some(group => group.gid === 2))
})

test.serial('Delete Group 2', async (t) => {
  const del = await request
    .delete('/api/group/2')
  t.is(del.status, 200)

  const find = await request
    .get('/api/group/2')

  t.is(find.status, 400)

  const user = await request
    .get('/api/user/admin')

  t.false(user.body.user.groups.some(group => group.gid === 2))
})

test('The length of group title should be greater than 3', async (t) => {
  const res = await request
    .post('/api/group')
    .send({
      title: '1',
      list: [ 'admin' ],
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('The length of group title should be less than 80', async (t) => {
  const res = await request
    .post('/api/group')
    .send({
      title: Array.from({ length: 50 }, (_, i) => `${i}`).join(''),
      list: [ 'admin' ],
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
