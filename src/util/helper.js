import pickBy from 'lodash.pickby'

function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

// TODO: 后期这里应该会改 URL
function testcaseUrl (pid, uuid, type = 'in') {
  return `/api/testcase/${pid}/${uuid}?type=${type}`
}

export {
  purify,
  testcaseUrl,
}
