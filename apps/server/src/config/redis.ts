import { Redis } from 'ioredis'
import logger from '../utils/logger.ts'
import config from './index.ts'

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
