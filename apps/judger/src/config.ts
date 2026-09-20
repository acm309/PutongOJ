import type { RedisOptions } from 'ioredis'
import path from 'node:path'
import process from 'node:process'
import dotenvFlow from 'dotenv-flow'
import { DEFAULT_REDIS_OPTIONS, parseRedisUrl } from './utils/redis.ts'

const workspaceRoot = path.resolve(import.meta.dirname, '../../..')
dotenvFlow.config({ path: workspaceRoot })

export interface JudgerConfig {
  mongodbURL: string
  redisOptions: RedisOptions
  redisURL: string
  sandboxEndpoint: string
  dataDir: string
  sandboxDataDir: string
}

export function loadJudgerConfig (env: NodeJS.ProcessEnv = process.env): JudgerConfig {
  const mongodbURL = env.PTOJ_MONGODB_URL?.trim() || 'mongodb://localhost:27017/oj'
  const redisURL = env.PTOJ_REDIS_URL?.trim() || 'redis://localhost:6379'
  const redisOptions = parseRedisUrl(redisURL)
  const sandboxEndpoint = env.PTOJ_SANDBOX_ENDPOINT?.trim() || 'http://localhost:5050'
  const dataDir = path.resolve(workspaceRoot, env.PTOJ_DATA_DIR?.trim() || 'apps/server/data')
  const sandboxDataDir = env.PTOJ_SANDBOX_DATA_DIR?.trim() || '/app/data'

  return {
    mongodbURL,
    redisOptions: {
      ...DEFAULT_REDIS_OPTIONS,
      ...redisOptions,
    },
    redisURL,
    sandboxEndpoint,
    dataDir,
    sandboxDataDir,
  }
}
