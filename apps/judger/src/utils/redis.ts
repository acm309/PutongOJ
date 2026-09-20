import type { RedisOptions } from 'ioredis'

export const DEFAULT_REDIS_OPTIONS: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: null,
}

export function parseRedisUrl (url: string): RedisOptions {
  const parsed = new URL(url)
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new TypeError(`Unsupported Redis protocol: ${parsed.protocol}`)
  }

  const db = parsed.pathname.length > 1
    ? Number.parseInt(parsed.pathname.slice(1), 10)
    : undefined

  if (db !== undefined && (!Number.isInteger(db) || db < 0)) {
    throw new TypeError(`Invalid Redis database index: ${parsed.pathname.slice(1)}`)
  }

  return {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  }
}
