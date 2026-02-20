import type Redis from 'ioredis'
import type { Types } from 'mongoose'
import NodeCache from 'node-cache'
import redis from '../config/redis'

const MEMORY_CACHE_TTL = 3
const REDIS_CACHE_TTL = 5

const MEMORY_CHECK_PERIOD = 60
const REDIS_LOCK_TTL = 60
const REDIS_LOCK_RETRY = 50 // in milliseconds

interface CacheOptions {
  ttl?: number
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

  public async get<T>(key: string): Promise<T | null> {
    const memoryValue = this.memoryCache.get<T>(key)
    if (memoryValue !== undefined) {
      return memoryValue
    }

    const redisValue = await this.redisClient.get(key)
    const result = this.tryDecode<T>(redisValue)
    if (result !== null) {
      this.memoryCache.set(key, result)
    }

    return result
  }

  public async getOrCreate<T>(
    key: string,
    func: () => Promise<T>,
    opt?: CacheOptions,
  ): Promise<T> {
    let value = this.memoryCache.get<T>(key)
    if (value !== undefined) {
      return value
    }

    value = await this.getOrCreateFromRedisCache<T>(key, func, opt)
    this.memoryCache.set(key, value)

    return value
  }

  public async remove (key: string): Promise<void> {
    await this.redisClient.del(key)
    this.memoryCache.del(key)
  }

  async getOrCreateFromRedisCache<T>(
    key: string,
    func: () => Promise<T>,
    opt?: CacheOptions,
  ): Promise<T> {
    let value = await this.redisClient.get(key)
    let result: T | null = null

    // hit the cache
    result = this.tryDecode<T>(value)
    if (result !== null) {
      return result
    }

    // wait if updating
    value = await this.waitLock(key)
    result = this.tryDecode<T>(value)
    if (result !== null) {
      return result
    }

    await this.setLock(key)

    try {
      result = await func()
      value = JSON.stringify(result)

      const ttl = opt?.ttl ?? REDIS_CACHE_TTL
      await this.redisClient.set(key, value, 'EX', ttl)
    } finally {
      await this.releaseLock(key)
    }

    return result
  }

  tryDecode<T>(value: string | null): T | null {
    if (value === null) {
      return null
    }

    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async waitLock (key: string): Promise<string | null> {
    const lockKey = CacheKey.updateLock(key)

    let lockValue = await this.redisClient.get(lockKey)
    if (lockValue === null) {
      return null
    }

    while (lockValue !== null) {
      await new Promise(resolve => setTimeout(resolve, REDIS_LOCK_RETRY))
      lockValue = await this.redisClient.get(lockKey)
    }

    return await this.redisClient.get(key)
  }

  async setLock (lock: string): Promise<void> {
    const lockKey = CacheKey.updateLock(lock)
    await this.redisClient.set(lockKey, '', 'EX', REDIS_LOCK_TTL, 'NX')
  }

  async releaseLock (lock: string): Promise<void> {
    const lockKey = CacheKey.updateLock(lock)
    await this.redisClient.del(lockKey)
  }
}

export const cacheService = new CacheService()

export class CacheKey {
  public static updateLock (key: string) {
    return `cache:update_lock:${key}`
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
}
