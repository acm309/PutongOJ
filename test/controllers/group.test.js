const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')
const meta = require('../meta')
// const config = require('../../config')

const server = app.listen()
const request = supertest.agent(server)

test('Group list', async t => {
  const res = await request
    .get('/api/group/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list))
})

test('Find Group 1', async t => {
  const res = await request
    .get('/api/group/1')

  t.is(res.status, 200)
  for (const [key, value] of Object.entries(meta.groups[1])) {
    t.deepEqual(res.body.group[key], value)
  }
})

test('Group should fail to find one', async (t) => {
  const res = await request
    .get('/api/group/10000')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

// admin 用户登录不了？？
// test.serial('Create new group', async t => {
//   const login = await request
//     .post('/api/session')
//     .send({
//       uid: 'admin',
//       pwd: config.deploy.adminInitPwd
//     })

//   t.is(login.status, 200)

//   const create = await request
//     .post('/api/group')
//     .send({
//       title: '测试组2',
//       list: [ 'pu' ]
//     })

//   t.is(create.status, 200)

//   const find = await request
//     .get('/api/group/2')

//   t.is(find.status, 200)
//   t.is(find.group.title, '测试组2')
//   t.deepEqual(find.group.list, [ 'pu' ])
// })

// test.serial('Update Group 2', async t => {
//   const update = await request
//     .put('/api/group/2')
//     .send({
//       title: '测试组更新2',
//       list: [ 'admin' ]
//     })
//   t.is(update.status, 200)

//   const find = await request
//     .get('/api/group/2')

//   t.is(find.status, 200)
//   t.is(find.body.group.title, '测试组更新2')
//   t.deepEqual(find.body.group.list, [ 'admin' ])
// })

test.after.always('close server', t => {
  server.close()
})
