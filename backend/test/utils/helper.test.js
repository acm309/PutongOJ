const test = require('ava')
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
