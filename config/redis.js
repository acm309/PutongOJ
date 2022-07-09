const Redis = require('ioredis')
const logger = require('../utils/logger')
const config = require('./')

const redis = new Redis(config.redisURL)

redis.on('connect', () => {
  logger.info('Redis server is connected')
})

redis.on('error', (err) => {
  logger.error('Redis connected fail.')
  logger.error(err)
  process.exit(-1)
})

module.exports = redis
