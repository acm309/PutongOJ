import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

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

let createPid: number | null = null

test.serial('create a new problem', async (t) => {
  const create = await request
    .post('/api/problem')
    .send({
      title: '比较大小',
      description: '本题要求将输入的任意3个整数从小到大输出。',
      input: '输入在一行中给出3个整数，其间以空格分隔。',
      output: '在一行中将3个整数从小到大输出，其间以“-&gt;”相连。',
      in: '4 2 8',
      out: '2->4->8',
    })

  t.is(create.status, 200)

  createPid = create.body.pid
})

test.serial('Update a problem', async (t) => {
  const update = await request
    .put(`/api/problem/${createPid}`)
    .send({
      title: '更新新建题目',
      description: '应该可以更新成功吧',
    })
  t.is(update.status, 200)

  const find = await request
    .get(`/api/problem/${createPid}`)

  t.is(find.status, 200)
  t.is(find.body.title, '更新新建题目')
  t.is(find.body.description, '应该可以更新成功吧')
})

test.serial('Delete a Problem', async (t) => {
  const del = await request
    .delete(`/api/problem/${createPid}`)
  t.is(del.status, 200)

  const find = await request
    .get(`/api/problem/${createPid}`)

  t.is(find.status, 404)
})

test.after.always('close server', () => {
  server.close()
})
