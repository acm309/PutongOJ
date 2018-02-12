const Redis = require('ioredis')
const config = require('./')

const redis = new Redis(config.redisURL)

redis.on('error', function () {
  process.exit(-1)
})

module.exports = redis
