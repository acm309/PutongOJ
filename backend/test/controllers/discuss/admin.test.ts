import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'
import { only } from '../../../src/utils'
import { discussSeeds } from '../../seeds/discuss'

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async (t) => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: await encryptData(config.deploy.adminInitPwd),
    })

  t.is(login.status, 200)
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
    t.truthy(item.update)
  })
})

test('Find Discuss 1', async (t) => {
  const res = await request
    .get('/api/discuss/1')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')

  const select = discussSeeds.find(item => item.title === res.body.discuss.title)!
  const com = res.body.discuss.comments

  t.deepEqual(only(res.body.discuss, 'title uid'), only(select, 'title uid'))
  com.forEach((item: object, index: number) => {
    t.deepEqual(only(item, 'content create uid'), select.comments[index])
  })
})

test('Find non-exist Discuss', async (t) => {
  const res = await request
    .get('/api/discuss/1000')

  t.is(res.status, 404)
  t.truthy(res.body.error)
})

test('Delete Discuss 2', async (t) => {
  const res = await request
    .delete('/api/discuss/2')

  t.is(res.status, 200)
})

test('Delete with invalid did', async (t) => {
  const del = await request
    .delete('/api/discuss/invalid')

  t.is(del.status, 400)
  t.truthy(del.body.error)
})

test.after.always('close server', () => {
  server.close()
})
