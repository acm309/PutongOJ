import { Redis } from 'ioredis'
import config from './config.ts'

const redis = new Redis(config.redisURL)

redis.on('error', (error) => {
  console.error('Redis error:', error)
})

export default redis
