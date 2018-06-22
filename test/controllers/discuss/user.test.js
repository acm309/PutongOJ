const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')

const server = app.listen()
const request = supertest.agent(server)

const user = users.data['primaryuser']
let newDid = null

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: user.uid,
      pwd: user.pwd
    })

  t.is(login.status, 200)
})

test.serial('Create one discuss', async (t) => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: 'Yes',
      content: 'yes'
    })

  t.is(res.status, 200)

  const { did } = res.body
  newDid = did
  const find = await request
    .get(`/api/discuss/${did}`)

  t.is(find.status, 200)
  t.is(find.body.discuss.title, 'Yes')
  t.is(find.body.discuss.uid, user.uid)
  t.is(find.body.discuss.comments.length, 1)
  t.is(find.body.discuss.comments[0].content, 'yes')
  t.is(find.body.discuss.comments[0].uid, user.uid)
})

test('Add a comment', async t => {
  const res = await request
    .put(`/api/discuss/${newDid}`)
    .send({
      content: 'nothing'
    })

  t.is(res.status, 200)
  t.is(res.body.did, newDid)

  const find = await request
    .get(`/api/discuss/${newDid}`)

  const { comments } = find.body.discuss

  t.is(find.status, 200)
  t.is(comments.length, 2)
  t.is(comments[comments.length - 1].uid, user.uid)
  t.is(comments[comments.length - 1].content, 'nothing')
})

test('Title can not be empty', async t => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: '',
      content: 'nothing'
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Title is too long', async t => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: Array.from({ length: 50 }, (_, i) => '' + i).join(''),
      content: 'nothing'
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Content can not be empty on creation', async t => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: 'test',
      content: ''
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Content can not be empty on update', async t => {
  const res = await request
    .put(`/api/discuss/${newDid}`)
    .send({
      content: ''
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
