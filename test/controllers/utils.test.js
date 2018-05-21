const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')
const websiteConfig = require('../../config/website')

const server = app.listen()
const request = supertest.agent(server)

test('Server time', async t => {
  const res = await request
    .get('/api/servertime')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(res.body.serverTime)
  t.truthy(Number.isInteger(res.body.serverTime))
})

test('Website config', async t => {
  const res = await request
    .get('/api/website')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.deepEqual(res.body.website, websiteConfig)
})