const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')
const { newsSeeds } = require('../../seeds/news')

const server = app.listen()
const request = supertest.agent(server)

test('News list', async (t) => {
  const res = await request
    .get('/api/news/list')

  t.plan(4)

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list.docs))

  if (res.body.list.docs.length > 0) {
    t.truthy(res.body.list.docs[0].title)
  } else {
    t.pass('News list is empty')
  }
})

test('News fails to find one because nid does not exist', async (t) => {
  const res = await request
    .get('/api/news/-1')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('News fails to find one because nid is not number', async (t) => {
  const res = await request
    .get('/api/news/xx')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Visitor can not update news', async (t) => {
  const res = await request
    .put('/api/news/5')
    .send({
      title: 'xx',
      content: 'xxx',
    })

  t.is(res.status, 401)
  t.is(res.type, 'application/json')
  t.truthy(res.body.error)

  const find = await request
    .get('/api/news/5')

  t.is(find.status, 200)
  t.is(find.type, 'application/json')
  t.not(find.body.news.title, 'xx')
  t.not(find.body.news.content, 'xxx')
})

test('News finds one', async (t) => {
  const res = await request
    .get('/api/news/5')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(res.body.news.nid)
  t.truthy(res.body.news.title)

  const n = newsSeeds.find(item => item.title === res.body.news.title)

  t.is(res.body.news.content, n.content)
})

test.after.always('close server', () => {
  server.close()
})
