import { resolve } from 'node:path'
import process from 'node:process'
import dotenvFlow from 'dotenv-flow'

const workspaceRoot = resolve(import.meta.dirname, '../../..')
dotenvFlow.config({ path: workspaceRoot })

function numberEnv (name: string, defaultValue: number): number {
  const value = process.env[name]?.trim()
  if (value === undefined || value === '') {
    return defaultValue
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

const config = {
  port: numberEnv('PTOJ_WS_PORT', 3001),
  redisURL: process.env.PTOJ_REDIS_URL?.trim() || 'redis://localhost:6379',
} as const

export default config
