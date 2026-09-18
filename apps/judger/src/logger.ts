import type { Writable } from 'node:stream'
import { createWriteStream } from 'node:fs'
import process from 'node:process'
import { format } from 'node:util'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

let minimumPriority = levelPriority.debug
let fileStream: Writable | undefined

function timestamp (): string {
  return new Date().toISOString()
}

function write (level: LogLevel, scope: string, args: unknown[]): void {
  if (levelPriority[level] < minimumPriority) {
    return
  }

  const message = format(...args)
  const consoleLine = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${scope}: ${message}`
  const fileLine = `${timestamp()} [${level.toUpperCase()}] ${scope}: ${message}\n`

  if (level === 'error') {
    console.error(consoleLine)
  } else if (level === 'warn') {
    console.warn(consoleLine)
  } else {
    console.log(consoleLine)
  }

  fileStream?.write(fileLine)
}

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export function createLogger (scope: string): Logger {
  return {
    debug: (...args) => write('debug', scope, args),
    info: (...args) => write('info', scope, args),
    warn: (...args) => write('warn', scope, args),
    error: (...args) => write('error', scope, args),
  }
}

export function configureLogger (options: { debug: boolean, logFile?: string }): void {
  minimumPriority = options.debug ? levelPriority.debug : levelPriority.info
  fileStream?.end()
  fileStream = options.logFile
    ? createWriteStream(options.logFile, { flags: 'a' })
    : undefined
}

export async function closeLogger (): Promise<void> {
  if (!fileStream) {
    return
  }

  const stream = fileStream
  fileStream = undefined
  await new Promise<void>((resolve, reject) => {
    stream.end((error?: Error | null) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

process.once('exit', () => {
  fileStream?.end()
})
