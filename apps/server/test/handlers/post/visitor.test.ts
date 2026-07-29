import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'

const server = app.listen()
const adminRequest = supertest.agent(server)
const request = supertest.agent(server)

async function createAndUpdatePost (title: string, update: Record<string, any>) {
  const create = await adminRequest
    .post('/api/admin/posts')
    .send({ title })

  const slug = create.body.data.slug as string
  await adminRequest.put(`/api/admin/posts/${slug}`).send(update)
  return slug
}

let visiblePublishedSlug = ''
let hiddenPublishedSlug = ''
let visibleDraftSlug = ''
let hiddenDraftSlug = ''

test.before(async () => {
  const login = await adminRequest
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })

  if (login.status !== 200) {
    throw new Error(`Admin login failed with status ${login.status}`)
  }

  [ visiblePublishedSlug, hiddenPublishedSlug, visibleDraftSlug, hiddenDraftSlug ] = await Promise.all([
    createAndUpdatePost('Visitor Visible Published', { isPublished: true, isHidden: false }),
    createAndUpdatePost('Visitor Hidden Published', { isPublished: true, isHidden: true }),
    createAndUpdatePost('Visitor Visible Draft', { isPublished: false, isHidden: false }),
    createAndUpdatePost('Visitor Hidden Draft', { isPublished: false, isHidden: true }),
  ])
})

test.serial('Visitor list only shows published and non-hidden posts', async (t) => {
  const list = await request.get('/api/posts')

  t.is(list.status, 200)
  t.true(list.body.success)

  const docs = list.body.data.docs as Array<{ slug: string, isPublished: boolean, isPinned: boolean, isHidden: boolean }>
  const bySlug = new Map(docs.map(doc => [ doc.slug, doc ]))

  t.truthy(bySlug.get(visiblePublishedSlug))
  t.falsy(bySlug.get(hiddenPublishedSlug))
  t.falsy(bySlug.get(visibleDraftSlug))
  t.falsy(bySlug.get(hiddenDraftSlug))
})

test.serial('Visitor can access published post by slug even if hidden', async (t) => {
  const res = await request.get(`/api/posts/${hiddenPublishedSlug}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.isHidden, true)
})

test.serial('Visitor cannot access unpublished post by slug', async (t) => {
  const res = await request.get(`/api/posts/${visibleDraftSlug}`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Visitor cannot create post', async (t) => {
  const res = await request
    .post('/api/admin/posts')
    .send({
      title: 'Unauthorized Post',
    })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test.serial('Visitor cannot update post', async (t) => {
  const res = await request
    .put(`/api/admin/posts/${visiblePublishedSlug}`)
    .send({
      title: 'Unauthorized Update',
    })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test.serial('Visitor cannot delete post', async (t) => {
  const res = await request
    .delete(`/api/admin/posts/${visiblePublishedSlug}`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
