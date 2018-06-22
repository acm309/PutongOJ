const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')

const server = app.listen()
const request = supertest.agent(server)
const user = Object.values(users.data)[15]
let newDid

const newDiscuss = {
  title: '一楼',
  content: '我是一楼，欧耶'
}

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: user.uid,
      pwd: user.pwd
    })

  t.is(login.status, 200)
})

test.serial('create a new discuss', async t => {
  const create = await request
    .post('/api/discuss')
    .send(newDiscuss)

  t.is(create.status, 200)

  newDid = create.body.did

  const find = await request
    .get(`/api/discuss/${newDid}`)

  t.is(find.status, 200)
  console.log(find.body)
  t.is(find.body.discuss.title, newDiscuss.title)
  t.is(find.body.discuss.comments[0].content, newDiscuss.content)
})

test.serial('Update a discuss', async t => {
  const update = await request
    .put(`/api/discuss/${newDid}`)
    .send({ content: '楼主是变态' })

  t.is(update.status, 200)

  const find = await request
    .get(`/api/discuss/${newDid}`)

  t.is(find.status, 200)

  const comments = find.body.discuss.comments
  const content = comments[comments.length - 1].content

  t.is(content, '楼主是变态')
})

test.after.always('close server', t => {
  server.close()
})
