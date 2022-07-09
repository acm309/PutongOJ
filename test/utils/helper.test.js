const test = require('ava')
const helper = require('../../utils/helper')
const config = require('../../config')

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
    privilege: config.privilege.Teacher,
  }))
  t.false(helper.isAdmin({
    privilege: config.privilege.PrimaryUser,
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
    privilege: config.privilege.Teacher,
  }))
  t.false(helper.isRoot({
    privilege: config.privilege.PrimaryUser,
  }))
  t.true(helper.isRoot({
    privilege: config.privilege.Root,
  }))
})
