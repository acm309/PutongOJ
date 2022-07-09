const fs = require('fs')
const { resolve } = require('path')
const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')
const websiteConfig = require('../../config/website')
const config = require('../../config')

const server = app.listen()
const request = supertest.agent(server)

const filepath = resolve(__dirname, 'utils.test.js')
const content = fs.readFileSync(filepath, 'utf8')

test('Server time', async (t) => {
  const res = await request
    .get('/api/servertime')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(res.body.serverTime)
  t.truthy(Number.isInteger(res.body.serverTime))
})

test('Website config', async (t) => {
  const res = await request
    .get('/api/website')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.deepEqual(res.body.website, websiteConfig)
})

test('Visitor can not submit file', async (t) => {
  const res = await request
    .post('/api/submit')
    .attach('image', filepath)
  t.is(res.status, 403)
})

test('Admin could submit file', async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd,
    })
  t.is(res.status, 200)

  const submit = await request
    .post('/api/submit')
    .attach('image', filepath)

  t.is(submit.status, 200)

  const { url } = submit.body
  const uploaded = url.match(/\/uploads\/(.*)/)[1]

  const uploadedContent = fs.readFileSync(
    resolve(__dirname, '../../public/uploads', uploaded),
    'utf8',
  )
  t.is(uploadedContent, content)
})
