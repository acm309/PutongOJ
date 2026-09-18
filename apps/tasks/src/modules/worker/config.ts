import type { RedisOptions } from 'ioredis'
import path from 'node:path'
import process from 'node:process'
import { DEFAULT_REDIS_OPTIONS, parseRedisUrl } from '../../utils/redis.ts'

export interface WorkerConfig {
  mongodbURL: string
  redisOptions: RedisOptions
  redisURL: string
  uploadDir: string
}

export function loadWorkerConfig (env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const mongodbURL = env.PTOJ_MONGODB_URL?.trim() || 'mongodb://localhost:27017/oj'
  const redisURL = env.PTOJ_REDIS_URL?.trim() || 'redis://localhost:6379'
  const redisOptions = parseRedisUrl(redisURL)
  const uploadDir = env.PTOJ_UPLOAD_DIR?.trim()
    || path.resolve(import.meta.dirname, '../../../../server/public/uploads')

  return {
    mongodbURL,
    redisOptions: {
      ...DEFAULT_REDIS_OPTIONS,
      ...redisOptions,
    },
    redisURL,
    uploadDir,
  }
}
