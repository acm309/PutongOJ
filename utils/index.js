const crypto = require('crypto')
const config = require('../config')
const redis = require('redis')
const client = redis.createClient({url: config.redisUrl})

/**
  A tiny helper function to generate pagination object
  @param {Object}
  @returns {Object}
*/
function extractPagination (pagination) {
  return {
    limit: pagination.limit,
    page: +pagination.page,
    pages: pagination.pages,
    total: pagination.total
  }
}

/**
  用 md5 + sha1 生成密码；
  之所以采用这种方法加密，只是因为历史遗留问题 -- 上一个 oj 是这么做的
  @param {String} - orginal password
  @returns {String} - encoded password
*/
function generatePwd (pwd) {
  return crypto.createHash('md5').update(pwd).digest('hex') +
    crypto.createHash('sha1').update(pwd).digest('hex')
}

/**
  A tiny helper function to detect whether the argument is undefined
  @param {*}
  @returns {Boolean} - whether the param is undefined
*/
function isUndefined (item) {
  return typeof item === 'undefined'
}

/**
  A function returning promise to push value with specific tag to redis
  @param {String}
  @param {String}
  @returns {Promise}
*/
function redisLPUSH (tag, value) {
  return new Promise((resolve, reject) => {
    client.lpush(tag, value, function (err, reply) {
      if (err) {
        reject(err)
      } else {
        resolve(reply)
      }
    })
  })
}

/**
  A function returning promise to get value labeled with specific tag in redis
  @param {String}
  @returns {Promise}
*/
function redisGet (key) {
  return new Promise((resolve, reject) => {
    client.get(key, function (err, reply) {
      if (err) {
        reject(err)
      } else {
        resolve(reply)
      }
    })
  })
}

/**
  A function returning promise to set value with specific tag in redis
  @param {String} - tag
  @param {String} - value
  @returns {Promise}
*/
function redisSet (key, value) {
  return new Promise((resolve, reject) => {
    client.set(key, value, function (err, reply) {
      if (err) {
        reject(err)
      } else {
        resolve(reply)
      }
    })
  })
}

/**
  A function returning promise to delete value with specific tag in redis
  @param {String} - tag
  @returns {Promise}
*/
function redisDel (key) {
  return new Promise((resolve, reject) => {
    client.del(key, function (err, reply) {
      if (err) {
        reject(err)
      } else {
        resolve(reply)
      }
    })
  })
}

/**
  Check whether a user is an admin or not
  @param {Object} - the user model
  @param {Boolean}
*/
function isAdmin (user) {
  return user && user.privilege === config.privilege.Admin
}

/**
  Check whether a code means Accepted
  @param {Number}
  @param {Boolean}
*/
function isAccepted (code) {
  return code === config.judge.Accepted
}

module.exports = {
  extractPagination,
  generatePwd,
  isUndefined,
  redisLPUSH,
  redisGet,
  redisSet,
  redisDel,
  isAccepted,
  isAdmin
}
