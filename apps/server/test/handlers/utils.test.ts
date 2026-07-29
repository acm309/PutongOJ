import test from 'ava'
import supertest from 'supertest'
import app from '../../src/app'

const server = app.listen()
const request = supertest.agent(server)

test('Server time', async (t) => {
  const res = await request
    .get('/api/servertime')

  t.is(res.status, 200)
  t.truthy(res.body.serverTime)
  t.truthy(Number.isInteger(res.body.serverTime))
})

test.skip('Website information', async (t) => {
  const res = await request
    .get('/api/website')

  t.is(res.status, 200)
  // t.is(res.body.title, websiteConfig.title)
  // t.is(res.body.buildSHA, websiteConfig.buildSHA)
  // t.is(res.body.buildTime, websiteConfig.buildTime)
  t.is(typeof res.body.apiPublicKey, 'string')
})
