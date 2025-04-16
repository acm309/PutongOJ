const crypto = require('node:crypto')
const pickBy = require('lodash.pickby')
const config = require('../config')

function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

function generatePwd (pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex') + crypto.createHash('sha1').update(pwd).digest('hex')
}

function isComplexPwd (pwd) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd)
}

function isLogined (ctx) {
  return ctx.session != null && ctx.session.profile != null && ctx.session.profile.uid != null
}

function isAdmin (profile) {
  if (profile == null || profile.privilege == null) { return false }
  if (Number.parseInt(profile.privilege) === config.privilege.Root || Number.parseInt(profile.privilege) === config.privilege.Admin) {
    return true
  } else {
    return false
  }
}

function isRoot (profile) {
  if (profile == null || profile.privilege == null) { return false }
  if (Number.parseInt(profile.privilege) === config.privilege.Root) {
    return true
  } else {
    return false
  }
}

function isUndefined (item) {
  return typeof item === 'undefined'
}

module.exports = {
  purify,
  generatePwd,
  isComplexPwd,
  isLogined,
  isAdmin,
  isRoot,
  isUndefined,
}
