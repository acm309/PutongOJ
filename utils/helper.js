const crypto = require('crypto')
const pickBy = require('lodash.pickby')

function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

function generatePwd (pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex') + crypto.createHash('sha1').update(pwd).digest('hex')
}

module.exports = {
  generatePwd,
  purify
}
