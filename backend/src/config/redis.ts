import process from 'node:process'
import Redis from 'ioredis'
import logger from '../utils/logger'
import config from './'

const redis = new Redis(config.redisURL)

redis.on('connect', () => {
  logger.info('Redis server is connected')
})

redis.on('error', (err) => {
  logger.error('Redis connected fail.')
  logger.error(err)
  process.exit(-1)
})

export default module.exports = redis
