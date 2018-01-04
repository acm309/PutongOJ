import pickBy from 'lodash.pickby'

function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

export {
  purify
}
