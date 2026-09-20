import { Redis } from 'ioredis'
import { createLogger } from '../utils/logger.ts'
import config from './index.ts'

const logger = createLogger('server.redis')
const redis = new Redis(config.redisURL)

redis.on('connect', () => {
  logger.info('Redis server is connected')
})

redis.on('reconnecting', () => {
  logger.warn('Redis is reconnecting...')
})

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error')
})

export default redis
