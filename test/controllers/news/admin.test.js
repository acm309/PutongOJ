const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const config = require('../../../config')
const news = require('../../seed/news')

const server = app.listen()
const request = supertest.agent(server)

// the nid will be used
// delete: 7
// update: 8

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd
    })

  t.is(login.status, 200)
})

test('Delete a news', async t => {
  const res = await request
    .delete('/api/news/7')

  t.is(res.status, 200)

  const find = await request
    .get('/api/news/7')

  t.is(find.status, 400)
})

test('fails to create a news', async t => {
  const res = await request
    .post('/api/news')
    .send({
      content: 'xx'
    })

  t.is(res.status, 400)
})

test('Create a news', async t => {
  const res = await request
    .post('/api/news')
    .send({
      title: 'abcdefg',
      content: 'xx'
    })

  t.is(res.status, 200)

  const { nid } = res.body
  const find = await request
    .get(`/api/news/${nid}`)

  t.is(res.status, 200)
  t.is(find.body.news.nid, nid)
  t.is(find.body.news.title, 'abcdefg')
  t.is(find.body.news.content, 'xx')
})

test('Update a news', async t => {
  const res = await request
    .put('/api/news/8')
    .send({
      title: '09876',
      content: '12345'
    })

  t.is(res.status, 200)

  const find = await request
    .get('/api/news/8')

  t.is(res.status, 200)
  t.is(find.body.news.nid, 8)
  t.is(find.body.news.title, '09876')
  t.is(find.body.news.content, '12345')
})
