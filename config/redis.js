const Redis = require('ioredis')
const config = require('./')

module.exports = new Redis(config.redisURL)
