import test from 'ava'
import redis from '../../src/config/redis'
import { CacheKey, cacheService } from '../../src/services/cache'

const KEY_PREFIX = 'cache_test'

async function cleanupByPrefix (): Promise<void> {
  const dataKeys = await redis.keys(`${KEY_PREFIX}:*`)
  const lockKeys = await redis.keys(`${CacheKey.updateLock(KEY_PREFIX)}:*`)
  const keys = [ ...dataKeys, ...lockKeys ]
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

test.beforeEach(async () => {
  await cleanupByPrefix()
})

test.afterEach.always(async () => {
  await cleanupByPrefix()
})

// ─── get ───────────────────────────────────────────────────────────────────

test.serial('get (miss)', async (t) => {
  const key = `${KEY_PREFIX}:get:miss`
  const result = await cacheService.get<string>(key)
  t.is(result, null)
})

test.serial('get (redis hit)', async (t) => {
  const key = `${KEY_PREFIX}:get:redis_hit`
  const expected = { data: 'from-redis' }
  await redis.set(key, JSON.stringify(expected), 'EX', 60)
  const result = await cacheService.get<typeof expected>(key)
  t.deepEqual(result, expected)
})

test.serial('get (invalid JSON in redis)', async (t) => {
  const key = `${KEY_PREFIX}:get:bad_json`
  await redis.set(key, '{ not json }{', 'EX', 60)
  const result = await cacheService.get<unknown>(key)
  t.is(result, null)
})

// ─── remove ────────────────────────────────────────────────────────────────

test.serial('remove', async (t) => {
  const key = `${KEY_PREFIX}:remove`

  await cacheService.getOrCreate(key, async () => ({ x: 1 }))
  await cacheService.remove(key)

  const redisVal = await redis.get(key)
  t.is(redisVal, null)

  // Ensure old memory entry is gone: if remove() forgot memory eviction,
  // this would return stale { x: 1 } instead of the new redis value.
  await redis.set(key, JSON.stringify({ x: 2 }), 'EX', 60)
  const afterGet = await cacheService.get<{ x: number }>(key)
  t.deepEqual(afterGet, { x: 2 })
})

// ─── getOrCreate ───────────────────────────────────────────────────────────

test.serial('getOrCreate (factory called on miss)', async (t) => {
  const key = `${KEY_PREFIX}:getorcreate:factory`

  let callCount = 0
  const factory = async () => {
    callCount++
    return { value: 'created' }
  }

  const result = await cacheService.getOrCreate(key, factory)
  t.deepEqual(result, { value: 'created' })
  t.is(callCount, 1)

  // Second call – factory should NOT be invoked (memory cache hit)
  const result2 = await cacheService.getOrCreate(key, factory)
  t.deepEqual(result2, { value: 'created' })
  t.is(callCount, 1) // still 1
})

test.serial('getOrCreate (redis hit)', async (t) => {
  const key = `${KEY_PREFIX}:getorcreate:redis_hit`
  const expected = { msg: 'already-in-redis' }
  await redis.set(key, JSON.stringify(expected), 'EX', 60)

  let callCount = 0
  const result = await cacheService.getOrCreate<typeof expected>(key, async () => {
    callCount++
    return { msg: 'should-not-be-reached' }
  })

  t.deepEqual(result, expected)
  t.is(callCount, 0)
})

test.serial('getOrCreate (custom redisTtl)', async (t) => {
  const key = `${KEY_PREFIX}:getorcreate:custom_ttl`
  const customTtl = 120

  const result = await cacheService.getOrCreate(
    key,
    async () => ({ ttl: 'custom' }),
    { redisTtl: customTtl },
  )
  t.deepEqual(result, { ttl: 'custom' })

  const ttl = await redis.ttl(key)
  t.true(ttl > 0 && ttl <= customTtl)
})

test.serial('getOrCreate (skipMemoryCache)', async (t) => {
  const key = `${KEY_PREFIX}:getorcreate:skip_memory`

  let createCount = 0
  const created = await cacheService.getOrCreate(
    key,
    async () => {
      createCount++
      return { from: 'factory' }
    },
    { skipMemoryCache: true },
  )
  t.deepEqual(created, { from: 'factory' })
  t.is(createCount, 1)

  await redis.set(key, JSON.stringify({ from: 'redis-updated' }), 'EX', 60)

  const result = await cacheService.getOrCreate(
    key,
    async () => {
      createCount++
      return { from: 'should-not-run' }
    },
    { skipMemoryCache: true },
  )

  t.deepEqual(result, { from: 'redis-updated' })
  t.is(createCount, 1)
})

test.serial('getOrCreate (concurrent calls should only run one factory)', async (t) => {
  const key = `${KEY_PREFIX}:getorcreate:concurrent`

  let callCount = 0
  const factory = async () => {
    callCount++
    await new Promise(resolve => setTimeout(resolve, 200))
    return { from: 'factory-once' }
  }

  const [ result1, result2, result3 ] = await Promise.all([
    cacheService.getOrCreate(key, factory, { skipMemoryCache: true }),
    cacheService.getOrCreate(key, factory, { skipMemoryCache: true }),
    cacheService.getOrCreate(key, factory, { skipMemoryCache: true }),
  ])

  t.deepEqual(result1, { from: 'factory-once' })
  t.deepEqual(result2, { from: 'factory-once' })
  t.deepEqual(result3, { from: 'factory-once' })
  t.is(callCount, 1)

  const lockValue = await redis.get(CacheKey.updateLock(key))
  t.is(lockValue, null)
})
