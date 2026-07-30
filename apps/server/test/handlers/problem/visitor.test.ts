import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { problemSeeds } from '../../seeds/problem'

const server = app.listen()
const request = supertest.agent(server)

test('Problem list', async (t) => {
  const res = await request
    .get('/api/problems')

  t.is(res.status, 200)
  t.truthy(Array.isArray(res.body.list.items))
  t.truthy(Array.isArray(res.body.solvedProblemIds))

  if (res.body.list.items.length > 0) {
    t.truthy(res.body.list.items[0].title)
    t.truthy(res.body.list.items[0].id)
  }
})

test('Problem find one', async (t) => {
  const res = await request.get('/api/problems/1001')

  t.is(res.status, 200)
  t.is(res.body.id, 1001)
  t.is(res.body.title, problemSeeds[1]!.title)
  t.is(res.body.description, problemSeeds[1]!.description)
  t.is(res.body.inputFormat, problemSeeds[1]!.input)
  t.is(res.body.outputFormat, problemSeeds[1]!.output)
  t.is(res.body.sampleInput, problemSeeds[1]!.in)
  t.is(res.body.sampleOutput, problemSeeds[1]!.out)
})

test('Problem should fail to find one', async (t) => {
  const res = await request
    .get('/api/problems/10000')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Pid is not a number', async (t) => {
  const res = await request
    .get('/api/problems/xx')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.after.always('close server', () => {
  server.close()
})
