import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)
const user = userSeeds.primaryuser
const newDiscuss = {
  title: '一楼',
  content: '我是一楼，欧耶',
}
let newDid: number | null = null

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: user.uid,
      password: await encryptData(user.pwd!),
    })

  t.is(login.status, 200)
})

test.serial('create a new discuss', async (t) => {
  const create = await request
    .post('/api/discuss')
    .send(newDiscuss)

  t.is(create.status, 200)

  newDid = create.body.did

  const find = await request
    .get(`/api/discuss/${newDid}`)

  t.is(find.status, 200)
  t.is(find.body.discuss.title, newDiscuss.title)
  t.is(find.body.discuss.uid, user.uid)
  t.is(find.body.discuss.comments.length, 1)
  t.is(find.body.discuss.comments[0].content, newDiscuss.content)
  t.is(find.body.discuss.comments[0].uid, user.uid)
})

test.serial('Add a comment', async (t) => {
  const update = await request
    .put(`/api/discuss/${newDid}`)
    .send({ content: 'nothing' })

  t.is(update.status, 200)

  const find = await request
    .get(`/api/discuss/${newDid}`)

  const { comments } = find.body.discuss

  t.is(find.status, 200)
  t.is(comments.length, 2)
  t.is(comments[comments.length - 1].uid, user.uid)
  t.is(comments[comments.length - 1].content, 'nothing')
})

test('Discuss list', async (t) => {
  const res = await request
    .get('/api/discuss/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list))
  res.body.list.forEach((item: any) => {
    t.truthy(item.title)
    t.truthy(item.uid)
    t.is(item.uid, user.uid)
    t.truthy(item.update)
  })
})

test('Reply other\'s discuss should fail', async (t) => {
  const update = await request
    .put(`/api/discuss/1`)
    .send({ content: 'nothing' })

  t.is(update.status, 403)
  t.is(update.type, 'application/json')

  t.truthy(update.body.error)
})

test('Did is not a number', async (t) => {
  const res = await request
    .get('/api/discuss/xx')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Find Discuss 1 should fail', async (t) => {
  const res = await request
    .get('/api/discuss/1')

  t.is(res.status, 403)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Title can not be empty', async (t) => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: '',
      content: 'nothing',
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Title is too long', async (t) => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: Array.from({ length: 50 }, (_, i) => `${i}`).join(''),
      content: 'nothing',
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Content can not be empty on creation', async (t) => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: 'test',
      content: '',
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test('Content can not be empty on update', async (t) => {
  const res = await request
    .put(`/api/discuss/${newDid}`)
    .send({
      content: '',
    })

  t.is(res.status, 400)
  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
