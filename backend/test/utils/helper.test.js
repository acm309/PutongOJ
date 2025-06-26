const test = require('ava')
const config = require('../../src/config')
const helper = require('../../src/utils/helper')

test('helper.purify', (t) => {
  t.deepEqual(helper.purify({
    a: null,
    b: 'test',
    c: '',
    d: {
      c: '',
      a: null,
      b: 'test',
    },
  }), {
    b: 'test',
    d: {
      c: '',
      a: null,
      b: 'test',
    },
  })
})

test('helper.isUndefined', (t) => {
  t.true(helper.isUndefined())
  t.true(helper.isUndefined(undefined))
  t.false(helper.isUndefined(null))
  t.false(helper.isUndefined(''))
  t.false(helper.isUndefined('undefined'))
  t.false(helper.isUndefined({}))
  t.false(helper.isUndefined([]))
  t.false(helper.isUndefined(0))
})

test('helper.isAdmin', (t) => {
  t.true(helper.isAdmin({
    privilege: config.privilege.Root,
  }))
  t.true(helper.isAdmin({
    privilege: config.privilege.Admin,
  }))
  t.false(helper.isAdmin({
    privilege: config.privilege.User,
  }))
  t.false(helper.isAdmin({}))
  t.false(helper.isAdmin())
})

test('helper.isLogined', (t) => {
  t.true(helper.isLogined({
    session: {
      profile: {
        uid: '123',
      },
    },
  }))
  t.false(helper.isLogined({
    session: {
      profile: {},
    },
  }))
  t.false(helper.isLogined({ session: {} }))
})

test('helper.isRoot', (t) => {
  t.false(helper.isRoot(null))
  t.false(helper.isRoot({
    privilege: null,
  }))
  t.false(helper.isRoot({
    privilege: config.privilege.Admin,
  }))
  t.false(helper.isRoot({
    privilege: config.privilege.User,
  }))
  t.true(helper.isRoot({
    privilege: config.privilege.Root,
  }))
})
