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

test('Fails to create a tag -- tid is too short', async t => {
  const create = await request
    .post('/api/tag')
    .send({
      tid: '1',
      list: []
    })

  t.is(create.status, 400)
  t.truthy(create.body.error)
})

test('Fails to create a tag -- tid is too long', async t => {
  const create = await request
    .post('/api/tag')
    .send({
      tid: Array.from({length: 100}, (_, i) => i + '').join(''),
      list: []
    })

  t.is(create.status, 400)
  t.truthy(create.body.error)
})

test.serial('create a new tag', async t => {
  const create = await request
    .post('/api/tag')
    .send(newTag)

  t.is(create.status, 200)

  return Promise.all(
    newTag.list.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.true(res.body.problem.tags.includes(newTag.tid))
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

  return Promise.all(
    newTag.list.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.false(res.body.problem.tags.includes(newTag.tid))
    }),
    newList.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.true(res.body.problem.tags.includes(newTag.tid))
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

  return Promise.all(
    newList.map(async (item) => {
      const res = await request.get(`/api/problem/${item}`)
      t.false(res.body.problem.tags.includes(newTag.tid))
    })
  )
})

test.after.always('close server', t => {
  server.close()
})
