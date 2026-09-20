import type { Logger as PinoLogger } from 'pino'
import process from 'node:process'
import pino from 'pino'

export type Logger = PinoLogger

const rootLogger = pino({
  level: process.env.PTOJ_LOG_LEVEL?.trim() || 'info',
})

export function createLogger (name: string): Logger {
  return rootLogger.child({ name })
}
