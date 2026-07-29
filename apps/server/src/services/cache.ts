import type Redis from 'ioredis'
import type { Types } from 'mongoose'
import { randomUUID } from 'node:crypto'
import NodeCache from 'node-cache'
import redis from '../config/redis'

const MEMORY_CACHE_TTL = 3
const REDIS_CACHE_TTL = 5

const MEMORY_CHECK_PERIOD = 60
const REDIS_LOCK_TTL = 10
const REDIS_LOCK_RETRY_MS = 100
const REDIS_LOCK_MAX_RETRIES = 100

interface CacheOptions {
  skipMemoryCache?: boolean
}

interface CacheCreationOptions extends CacheOptions {
  redisTtl?: number
}

class CacheService {
  private memoryCache: NodeCache
  private redisClient: Redis

  constructor () {
    this.memoryCache = new NodeCache({
      stdTTL: MEMORY_CACHE_TTL,
      checkperiod: MEMORY_CHECK_PERIOD,
    })
    this.redisClient = redis
  }

  public async get<T>(
    key: string,
    opt?: CacheOptions,
  ): Promise<T | null> {
    const skipMemoryCache = this.shouldSkipMemoryCache(opt)

    if (!skipMemoryCache) {
      const memoryValue = this.memoryCache.get<T>(key)
      if (memoryValue !== undefined) {
        return memoryValue
      }
    }

    const redisValue = await this.redisClient.get(key)
    const value = this.tryDecode<T>(redisValue)
    if (value !== null && !skipMemoryCache) {
      this.memoryCache.set(key, value)
    }

    return value
  }

  public async getOrCreate<T>(
    key: string,
    func: () => Promise<T>,
    opt?: CacheCreationOptions,
  ): Promise<T> {
    const skipMemoryCache = this.shouldSkipMemoryCache(opt)

    if (!skipMemoryCache) {
      const memoryValue = this.memoryCache.get<T>(key)
      if (memoryValue !== undefined) {
        return memoryValue
      }
    }

    const value = await this.getOrCreateFromRedisCache<T>(key, func, opt)
    if (!skipMemoryCache) {
      this.memoryCache.set(key, value)
    }

    return value
  }

  public async remove (key: string): Promise<void> {
    await this.redisClient.del(key)
    this.memoryCache.del(key)
  }

  private async getOrCreateFromRedisCache<T>(
    key: string,
    func: () => Promise<T>,
    opt?: CacheCreationOptions,
  ): Promise<T> {
    let redisValue = await this.redisClient.get(key)
    let value = this.tryDecode<T>(redisValue)

    if (value !== null) {
      return value
    }

    const lockToken = await this.acquireLock(key)

    try {
      redisValue = await this.redisClient.get(key)
      value = this.tryDecode<T>(redisValue)

      if (value === null) {
        value = await func()

        const ttl = opt?.redisTtl ?? REDIS_CACHE_TTL
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl)
      }
    } finally {
      // always release lock
      await this.releaseLock(key, lockToken)
    }

    return value
  }

  private tryDecode<T>(value: string | null): T | null {
    if (value === null) {
      return null
    }

    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  private async acquireLock (key: string): Promise<string> {
    const lockKey = CacheKey.updateLock(key)
    const token = randomUUID()

    for (let i = 0; i < REDIS_LOCK_MAX_RETRIES; i++) {
      const result = await this.redisClient.set(lockKey, token, 'EX', REDIS_LOCK_TTL, 'NX')
      if (result === 'OK') {
        return token
      }

      await new Promise(resolve => setTimeout(resolve, REDIS_LOCK_RETRY_MS))
    }

    throw new Error(`Failed to acquire lock for key: ${key}`)
  }

  private async releaseLock (lock: string, token: string): Promise<void> {
    const lockKey = CacheKey.updateLock(lock)
    await this.redisClient.eval(`
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `, 1, lockKey, token)
  }

  private shouldSkipMemoryCache (opt?: CacheOptions): boolean {
    return opt?.skipMemoryCache ?? false
  }
}

export const cacheService = new CacheService()

export class CacheKey {
  public static updateLock (key: string) {
    return `cache:update_lock:${key}`
  }

  public static settings (key: string) {
    return `cache:settings:${key}`
  }

  public static contestProblems (contest: Types.ObjectId, isJury: boolean) {
    return `cache:contest:${contest.toString()}:problems:${isJury ? 'jury' : 'public'}`
  }

  public static contestRanklist (contest: Types.ObjectId, isJury: boolean) {
    return `cache:contest:${contest.toString()}:ranklist:${isJury ? 'jury' : 'public'}`
  }

  public static problemStatistics (problem: Types.ObjectId) {
    return `cache:problem:${problem.toString()}:statistics`
  }

  public static userSubmissionHeatmap (user: Types.ObjectId) {
    return `cache:user:${user.toString()}:submission_heatmap`
  }
}
