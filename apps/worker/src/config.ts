import type { RedisOptions } from 'ioredis'
import path from 'node:path'
import process from 'node:process'
import dotenvFlow from 'dotenv-flow'
import { DEFAULT_REDIS_OPTIONS, parseRedisUrl } from './utils/redis.ts'

const workspaceRoot = path.resolve(import.meta.dirname, '../../..')
dotenvFlow.config({ path: workspaceRoot, silent: true })

export interface WorkerConfig {
  mongodbURL: string
  redisOptions: RedisOptions
  redisURL: string
  uploadDir: string
  uploadStorage: 'local' | 's3'
}

export function loadWorkerConfig (env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const uploadStorage = env.PTOJ_UPLOAD_STORAGE?.trim() || 'local'
  if (uploadStorage !== 'local' && uploadStorage !== 's3') {
    throw new Error('PTOJ_UPLOAD_STORAGE must be local or s3')
  }
  const mongodbURL = env.PTOJ_MONGODB_URL?.trim() || 'mongodb://localhost:27017/oj'
  const redisURL = env.PTOJ_REDIS_URL?.trim() || 'redis://localhost:6379'
  const redisOptions = parseRedisUrl(redisURL)
  const uploadDir = path.resolve(
    workspaceRoot,
    env.PTOJ_UPLOAD_DIR?.trim() || 'apps/server/public/uploads',
  )

  return {
    mongodbURL,
    redisOptions: {
      ...DEFAULT_REDIS_OPTIONS,
      ...redisOptions,
    },
    redisURL,
    uploadDir,
    uploadStorage,
  }
}
