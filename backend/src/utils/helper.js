const pickBy = require('lodash/pickBy')
const config = require('../config')
const { generatePwd, isComplexPwd } = require('./index')

function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

function isLogined (ctx) {
  return ctx.session != null && ctx.session.profile != null && ctx.session.profile.uid != null
}

/** @deprecated */
function isAdmin (profile) {
  if (profile == null || profile.privilege == null) { return false }
  if (Number.parseInt(profile.privilege) === config.privilege.Root || Number.parseInt(profile.privilege) === config.privilege.Admin) {
    return true
  } else {
    return false
  }
}

/** @deprecated */
function isRoot (profile) {
  if (profile == null || profile.privilege == null) { return false }
  if (Number.parseInt(profile.privilege) === config.privilege.Root) {
    return true
  } else {
    return false
  }
}

module.exports = {
  purify,
  /** @deprecated Import from utils */
  generatePwd,
  /** @deprecated Import from utils */
  isComplexPwd,
  isLogined,
  isAdmin,
  isRoot,
}
