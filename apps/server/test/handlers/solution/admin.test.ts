import { JudgeStatus } from '@putongoj/shared'
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

test('Can see solution and sim of other users', async (t) => {
  const res = await request
    .get('/api/submissions/4')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data.similarity)
  t.truthy(res.body.data.similarSubmissionId)
  t.truthy(res.body.data.sourceCode)
  t.truthy(res.body.data.similarSubmission)
  t.truthy(res.body.data.similarSubmission.sourceCode)
})

test('Push solution to rejudge', async (t) => {
  const res = await request
    .put('/api/submissions/3')
    .send({ status: JudgeStatus.REJUDGE_PENDING })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data, null)
})

test.after.always('close server', () => {
  server.close()
})
