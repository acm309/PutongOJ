const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')
// const statistics = require('../../seed/statistics')

const server = app.listen()
const request = supertest.agent(server)

test('Statistics for pid 1001', async (t) => {
  const res = await request
    .get('/api/statistics/1001')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list))
  t.truthy(Array.isArray(res.body.countList))
  t.truthy(res.body.sumCharts)
  t.truthy(res.body.sumStatis)
})

test.after.always('close server', () => {
  server.close()
})
