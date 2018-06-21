const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const config = require('../../../config')

const server = app.listen()
const request = supertest.agent(server)

const newTag = {
  tid: 'newTag',
  list: [1001, 1004]
}
const newList = [1002, 1003]

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd
    })

  t.is(login.status, 200)
})

test('Tag list', async t => {
  const list = await request
    .get('/api/tag/list')

  t.is(list.status, 200)
  t.is(list.type, 'application/json')
  t.truthy(Array.isArray(list.body.list))
})

test.serial('create a new tag', async t => {
  const create = await request
    .post('/api/tag')
    .send(newTag)

  t.is(create.status, 200)

  Promise.all(
    newTag.list.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.true(res.body.problem.tags.includes(item))
    })
  )
})

test.serial('Update a tag', async t => {
  const update = await request
    .put(`/api/tag/${newTag.tid}`)
    .send({ list: newList })

  t.is(update.status, 200)

  const find = await request
    .get(`/api/tag/${newTag.tid}`)

  t.is(find.status, 200)
  t.deepEqual(find.body.tag.list, newList)

  Promise.all(
    newTag.list.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.false(res.body.problem.tags.includes(item))
    }),
    newList.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.true(res.body.problem.tags.includes(item))
    })
  )
})

test.serial('Delete a tag', async t => {
  const del = await request
    .delete(`/api/tag/${newTag.tid}`)

  t.is(del.status, 200)

  const find = await request
    .get(`/api/tag/${newTag.tid}`)

  t.is(find.status, 400)

  Promise.all(
    newList.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.false(res.body.problem.tags.includes(item))
    })
  )
})

test.after.always('close server', t => {
  server.close()
})
