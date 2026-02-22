import Redis from 'ioredis'
import config from '.'
import logger from '../utils/logger'

const redis = new Redis(config.redisURL)

redis.on('connect', () => {
  logger.info('Redis server is connected')
})

redis.on('reconnecting', () => {
  logger.warn('Redis is reconnecting...')
})

redis.on('error', (err) => {
  logger.error('Redis error:', err)
})

export default redis
