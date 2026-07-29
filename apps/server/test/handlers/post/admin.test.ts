import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'

const server = app.listen()
const request = supertest.agent(server)

test.before(async () => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })

  if (login.status !== 200) {
    throw new Error(`Admin login failed with status ${login.status}`)
  }
})

test.serial('Admin can create a post with default flags', async (t) => {
  const res = await request
    .post('/api/admin/posts')
    .send({ title: 'Admin Create Default Flags' })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data.slug)

  const slug = res.body.data.slug as string
  const find = await request.get(`/api/admin/posts/${slug}`)

  t.is(find.status, 200)
  t.true(find.body.success)
  t.is(find.body.data.title, 'Admin Create Default Flags')
  t.is(find.body.data.content, '')
  t.is(find.body.data.isPublished, false)
  t.is(find.body.data.isPinned, false)
  t.is(find.body.data.isHidden, false)
})

test.serial('Admin can update isPublished, isPinned, and isHidden', async (t) => {
  const create = await request
    .post('/api/admin/posts')
    .send({ title: 'Admin Update Flags' })

  t.is(create.status, 200)
  t.true(create.body.success)
  const slug = create.body.data.slug as string

  const update = await request
    .put(`/api/admin/posts/${slug}`)
    .send({
      isPublished: true,
      isPinned: true,
      isHidden: true,
      title: 'Admin Update Flags Updated',
      content: 'Updated content',
    })

  t.is(update.status, 200)
  t.true(update.body.success)

  const find = await request.get(`/api/admin/posts/${slug}`)
  t.is(find.status, 200)
  t.true(find.body.success)
  t.is(find.body.data.title, 'Admin Update Flags Updated')
  t.is(find.body.data.content, 'Updated content')
  t.is(find.body.data.isPublished, true)
  t.is(find.body.data.isPinned, true)
  t.is(find.body.data.isHidden, true)
})

test.serial('Admin list includes hidden and unpublished posts', async (t) => {
  const visiblePublished = await request.post('/api/admin/posts').send({ title: 'Admin List Visible Published' })
  const hiddenPublished = await request.post('/api/admin/posts').send({ title: 'Admin List Hidden Published' })
  const visibleDraft = await request.post('/api/admin/posts').send({ title: 'Admin List Visible Draft' })

  t.is(visiblePublished.status, 200)
  t.true(visiblePublished.body.success)
  t.is(hiddenPublished.status, 200)
  t.true(hiddenPublished.body.success)
  t.is(visibleDraft.status, 200)
  t.true(visibleDraft.body.success)

  const visiblePublishedSlug = visiblePublished.body.data.slug as string
  const hiddenPublishedSlug = hiddenPublished.body.data.slug as string
  const visibleDraftSlug = visibleDraft.body.data.slug as string

  await request.put(`/api/admin/posts/${visiblePublishedSlug}`).send({
    isPublished: true,
    isHidden: false,
    isPinned: true,
  })
  await request.put(`/api/admin/posts/${hiddenPublishedSlug}`).send({
    isPublished: true,
    isHidden: true,
  })
  await request.put(`/api/admin/posts/${visibleDraftSlug}`).send({
    isPublished: false,
    isHidden: false,
  })

  const list = await request.get('/api/admin/posts')
  t.is(list.status, 200)
  t.true(list.body.success)

  const docs = list.body.data.docs as Array<{ slug: string, isPublished: boolean, isPinned: boolean, isHidden: boolean }>
  const bySlug = new Map(docs.map(doc => [ doc.slug, doc ]))

  t.truthy(bySlug.get(visiblePublishedSlug))
  t.truthy(bySlug.get(hiddenPublishedSlug))
  t.truthy(bySlug.get(visibleDraftSlug))

  t.is(bySlug.get(visiblePublishedSlug)?.isPublished, true)
  t.is(bySlug.get(visiblePublishedSlug)?.isPinned, true)
  t.is(bySlug.get(visiblePublishedSlug)?.isHidden, false)

  t.is(bySlug.get(hiddenPublishedSlug)?.isPublished, true)
  t.is(bySlug.get(hiddenPublishedSlug)?.isHidden, true)

  t.is(bySlug.get(visibleDraftSlug)?.isPublished, false)
  t.is(bySlug.get(visibleDraftSlug)?.isHidden, false)

  const hiddenOnly = await request.get('/api/admin/posts').query({ isHidden: true })
  t.is(hiddenOnly.status, 200)
  t.true(hiddenOnly.body.success)
  const hiddenDocs = hiddenOnly.body.data.docs as Array<{ slug: string }>
  t.true(hiddenDocs.some(doc => doc.slug === hiddenPublishedSlug))
  t.false(hiddenDocs.some(doc => doc.slug === visiblePublishedSlug))

  const titleSearch = await request.get('/api/admin/posts').query({ title: 'Visible Draft' })
  t.is(titleSearch.status, 200)
  t.true(titleSearch.body.success)
  const titleDocs = titleSearch.body.data.docs as Array<{ slug: string }>
  t.true(titleDocs.some(doc => doc.slug === visibleDraftSlug))
})

test.serial('Admin root can delete a post', async (t) => {
  const create = await request
    .post('/api/admin/posts')
    .send({ title: 'Admin Delete Post' })

  t.is(create.status, 200)
  t.true(create.body.success)
  const slug = create.body.data.slug as string

  const del = await request.delete(`/api/admin/posts/${slug}`)
  t.is(del.status, 200)
  t.true(del.body.success)

  const find = await request.get(`/api/admin/posts/${slug}`)
  t.is(find.status, 200)
  t.false(find.body.success)
  t.is(find.body.code, 404)
})

test.serial('Admin cannot update post to a duplicate slug', async (t) => {
  const first = await request.post('/api/admin/posts').send({ title: 'Duplicate Slug A' })
  const second = await request.post('/api/admin/posts').send({ title: 'Duplicate Slug B' })

  t.is(first.status, 200)
  t.true(first.body.success)
  t.is(second.status, 200)
  t.true(second.body.success)

  const firstSlug = first.body.data.slug as string
  const secondSlug = second.body.data.slug as string

  const update = await request
    .put(`/api/admin/posts/${secondSlug}`)
    .send({ slug: firstSlug })

  t.is(update.status, 200)
  t.false(update.body.success)
  t.is(update.body.code, 400)
})

test.serial('Admin update on missing post returns not found', async (t) => {
  const res = await request
    .put('/api/admin/posts/non-existent-slug')
    .send({ title: 'Does not matter' })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Admin delete on missing post returns not found', async (t) => {
  const res = await request.delete('/api/admin/posts/non-existent-slug')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Admin create fails with invalid payload', async (t) => {
  const res = await request
    .post('/api/admin/posts')
    .send({})

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test.after.always('close server', () => {
  server.close()
})
