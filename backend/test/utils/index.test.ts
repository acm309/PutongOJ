import test from 'ava'
import helper from '../../src/utils'

test('Helper purify', (t) => {
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
