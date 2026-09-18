import type { RedisOptions } from 'ioredis'
import process from 'node:process'
import { DEFAULT_REDIS_OPTIONS, parseRedisUrl } from './utils/redis.ts'

function parseInteger (name: string, value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    throw new TypeError(`${name} must be an integer`)
  }
  return parsed
}

export interface JudgerConfig {
  redisOptions: RedisOptions
  redisURL: string
  sandboxEndpoint: string
  initConcurrent: number
  logFile?: string
  debug: boolean
}

export function loadConfig (env: NodeJS.ProcessEnv = process.env): JudgerConfig {
  const redisURL = env.PTOJ_REDIS_URL?.trim() || 'redis://localhost:6379'
  const redisOptions = parseRedisUrl(redisURL)
  const sandboxEndpoint = env.PTOJ_SANDBOX_ENDPOINT?.trim() || 'http://localhost:5050'
  const initConcurrent = parseInteger('PTOJ_INIT_CONCURRENT', env.PTOJ_INIT_CONCURRENT, 1)
  const logFile = env.PTOJ_LOG_FILE?.trim() || 'judger.log'
  const debugValue = env.PTOJ_DEBUG?.trim() || '1'

  if (initConcurrent < 1) {
    throw new RangeError('PTOJ_INIT_CONCURRENT must be greater than zero')
  }

  return {
    redisOptions: {
      ...DEFAULT_REDIS_OPTIONS,
      ...redisOptions,
    },
    redisURL,
    sandboxEndpoint,
    initConcurrent,
    logFile,
    debug: debugValue === '1',
  }
}
