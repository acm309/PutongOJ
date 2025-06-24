const { randomBytes } = require('node:crypto')
const { env } = require('node:process')

const config = {
  port: Number.parseInt(env.PORT) || 3000,
  dbURL: String(env.dbURL) || 'mongodb://localhost:27017/oj',
  redisURL: String(env.redisURL) || 'redis://localhost:6379',
  secretKey: String(env.secretKey) || randomBytes(16).toString('hex'),
}
const constants = require('../utils/constants')

module.exports = Object.freeze({
  ...config,
  ...constants,
})
