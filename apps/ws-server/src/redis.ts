import { Redis } from 'ioredis'
import config from './config.ts'
import { createLogger } from './logger.ts'

const logger = createLogger('ws-server.redis')
const redis = new Redis(config.redisURL)

redis.on('error', (error) => {
  logger.error({ err: error }, 'Redis error')
})

export default redis
