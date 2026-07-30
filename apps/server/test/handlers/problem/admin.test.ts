import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })

  t.is(login.status, 200)
})

let createPid: number | null = null

test.serial('create a new problem', async (t) => {
  const create = await request
    .post('/api/problems')
    .send({
      title: '比较大小',
      description: '本题要求将输入的任意3个整数从小到大输出。',
      inputFormat: '输入在一行中给出3个整数，其间以空格分隔。',
      outputFormat: '在一行中将3个整数从小到大输出，其间以“-&gt;”相连。',
      sampleInput: '4 2 8',
      sampleOutput: '2->4->8',
    })

  t.is(create.status, 200)

  createPid = create.body.data.id
})

test.serial('Update a problem', async (t) => {
  const update = await request
    .put(`/api/problems/${createPid}`)
    .send({
      title: '更新新建题目',
      description: '应该可以更新成功吧',
    })
  t.is(update.status, 200)

  const find = await request
    .get(`/api/problems/${createPid}`)

  t.is(find.status, 200)
  t.is(find.body.data.title, '更新新建题目')
  t.is(find.body.data.description, '应该可以更新成功吧')
  t.is(find.body.data.inputFormat, '输入在一行中给出3个整数，其间以空格分隔。')
  t.is(find.body.data.sampleOutput, '2->4->8')
})

test.serial('Delete a Problem', async (t) => {
  const del = await request
    .delete(`/api/problems/${createPid}`)
  t.is(del.status, 200)

  const find = await request
    .get(`/api/problems/${createPid}`)

  t.is(find.status, 200)
  t.is(find.body.success, false)
  t.is(find.body.code, 404)
})

test.after.always('close server', () => {
  server.close()
})
