import { Language } from '@putongoj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)
const adminRequest = supertest.agent(server)

let sid = null
let contestId: number | null = null

test.before(async (t) => {
  const adminLogin = await adminRequest
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })
  t.is(adminLogin.status, 200)

  const res = await request
    .post('/api/account/login')
    .send({
      username: 'primaryuser',
      password: await encryptData(userSeeds.primaryuser.pwd!),
    })
  t.is(res.status, 200)

  const createdContest = await adminRequest
    .post('/api/contests')
    .send({
      title: 'Solution Submit Contest',
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      isHidden: false,
      isPublic: true,
    })
  t.is(createdContest.status, 200)
  t.true(createdContest.body.success)
  contestId = createdContest.body.data.contestId

  const updatedContest = await adminRequest
    .put(`/api/contests/${contestId}/configs`)
    .send({ problems: [ 1000 ] })
  t.is(updatedContest.status, 200)
  t.true(updatedContest.body.success)

  const participate = await request
    .post(`/api/contests/${contestId}/participation`)
    .send({})
  t.is(participate.status, 200)
  t.true(participate.body.success)
})

test.serial('Submit a solution', async (t) => {
  const code = `
    #include <iostream>

    using namespace std;

    int main () {
      return 0;
    }
  `
  let res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.true(res.body.success)
  sid = res.body.data.solution

  res = await request.get(`/api/status/${sid}`)

  t.is(res.status, 200)
  t.is(res.body.solution.code, code)
})

test('Status fails to find one', async (t) => {
  const res = await request
    .get('/api/status/87654321')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Status fails to delete', async (t) => {
  const res = await request
    .del('/api/status/1000')

  t.is(res.status, 405)
})

test('Status fails to update', async (t) => {
  const res = await request
    .put('/api/status/1000')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Can not see solution of another user', async (t) => {
  const res = await request
    .get('/api/status/1')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Code is too long', async (t) => {
  const code = `
    #include <iostream>

    using namespace std;

    int main () {
      "${'a'.repeat(20000)}";
      return 0;
    }
  `
  const res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Code is too short', async (t) => {
  const code = '1;'
  const res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.serial('Contest submission rejects disallowed language', async (t) => {
  if (!contestId) {
    return t.fail('No contestId from setup')
  }

  const configRes = await adminRequest
    .put(`/api/contests/${contestId}/configs`)
    .send({ allowedLanguages: [ Language.Cpp17 ] })

  t.is(configRes.status, 200)
  t.true(configRes.body.success)

  const javaCode = `
    public class Main {
      public static void main(String[] args) {
        System.out.println(0);
      }
    }
  `

  const res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      contest: contestId,
      code: javaCode,
      language: Language.Java,
    })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test.serial('Contest submission accepts allowed language', async (t) => {
  if (!contestId) {
    return t.fail('No contestId from setup')
  }

  const code = `
    #include <iostream>

    int main() {
      std::cout << 0 << std::endl;
      return 0;
    }
  `

  const res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      contest: contestId,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.after.always('close server', () => {
  server.close()
})
