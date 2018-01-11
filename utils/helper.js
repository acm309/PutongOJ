const crypto = require('crypto')
const pickBy = require('lodash.pickby')
const jwt = require('jsonwebtoken')

function purify (obj) {
  return pickBy(obj, x => x != null && x !== '')
}

function generatePwd (pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex') + crypto.createHash('sha1').update(pwd).digest('hex')
}

const createToken = async (ctx, next) => {
  const uid = ctx.session.profile.uid
  const token = jwt.sign({
    uid
  }, 'acm309', {
    expiresIn: '60 * 60' // 过期时间设置为3600s
  })
  return token
}

module.exports = {
  generatePwd,
  purify,
  createToken
}
