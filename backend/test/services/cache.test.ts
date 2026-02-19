import test from 'ava'
import redis from '../../src/config/redis'
import { CacheKey, cacheService } from '../../src/services/cache'

// ─── tryDecode ─────────────────────────────────────────────────────────────

test('tryDecode (null input)', (t) => {
  t.is(cacheService.tryDecode(null), null)
})

test('tryDecode (valid JSON)', (t) => {
  const obj = { hello: 'world', count: 42 }
  t.deepEqual(cacheService.tryDecode<typeof obj>(JSON.stringify(obj)), obj)
})

test('tryDecode (JSON primitive string)', (t) => {
  // JSON.parse('"hello"') === "hello" is valid JSON – should return the string
  t.is(cacheService.tryDecode<string>('"hello"'), 'hello')
})

test('tryDecode (invalid JSON)', (t) => {
  t.is(cacheService.tryDecode('{ bad json }{'), null)
})

// ─── get ───────────────────────────────────────────────────────────────────

test.serial('get (miss)', async (t) => {
  const key = 'cache_test:get:miss'
  await redis.del(key)
  const result = await cacheService.get<string>(key)
  t.is(result, null)
})

test.serial('get (redis hit)', async (t) => {
  const key = 'cache_test:get:redis_hit'
  const expected = { data: 'from-redis' }
  await redis.set(key, JSON.stringify(expected), 'EX', 60)
  const result = await cacheService.get<typeof expected>(key)
  t.deepEqual(result, expected)
  await redis.del(key)
})

test.serial('get (invalid JSON in redis)', async (t) => {
  const key = 'cache_test:get:bad_json'
  await redis.set(key, '{ not json }{', 'EX', 60)
  const result = await cacheService.get<unknown>(key)
  t.is(result, null)
  await redis.del(key)
})

// ─── remove ────────────────────────────────────────────────────────────────

test.serial('remove', async (t) => {
  const key = 'cache_test:remove'
  // Seed the key into the cache via getOrCreate
  await cacheService.getOrCreate(key, async () => ({ x: 99 }))
  // Confirm the value is there
  const before = await cacheService.get<{ x: number }>(key)
  t.deepEqual(before, { x: 99 })

  await cacheService.remove(key)

  // After removal both redis and memory should be empty
  const redisVal = await redis.get(key)
  t.is(redisVal, null)

  // Memory cache is private, but a get() that misses redis should return null
  // (memory cache cannot be inspected directly but the full chain reflects removal)
  const afterGet = await cacheService.get<{ x: number }>(key)
  t.is(afterGet, null)
})

// ─── getOrCreate ───────────────────────────────────────────────────────────

test.serial('getOrCreate (factory called on miss)', async (t) => {
  const key = 'cache_test:getorcreate:factory'
  await redis.del(key)

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

  await cacheService.remove(key)
})

test.serial('getOrCreate (redis hit)', async (t) => {
  const key = 'cache_test:getorcreate:redis_hit'
  const expected = { msg: 'already-in-redis' }
  await redis.set(key, JSON.stringify(expected), 'EX', 60)

  let callCount = 0
  const result = await cacheService.getOrCreate<typeof expected>(key, async () => {
    callCount++
    return { msg: 'should-not-be-reached' }
  })

  t.deepEqual(result, expected)
  t.is(callCount, 0)

  await cacheService.remove(key)
})

test.serial('getOrCreate (custom TTL)', async (t) => {
  const key = 'cache_test:getorcreate:custom_ttl'
  await redis.del(key)

  const result = await cacheService.getOrCreate(
    key,
    async () => ({ ttl: 'custom' }),
    { ttl: 120 },
  )
  t.deepEqual(result, { ttl: 'custom' })

  const ttl = await redis.ttl(key)
  t.true(ttl > 0 && ttl <= 120)

  await cacheService.remove(key)
})

// ─── setLock / releaseLock ─────────────────────────────────────────────────

test.serial('setLock', async (t) => {
  const lockBase = 'cache_test:lock:base'
  const lockKey = CacheKey.updateLock(lockBase)
  await redis.del(lockKey)

  await cacheService.setLock(lockBase)
  const exists = await redis.exists(lockKey)
  t.is(exists, 1)

  await cacheService.releaseLock(lockBase)
})

test.serial('releaseLock', async (t) => {
  const lockBase = 'cache_test:lock:release'
  const lockKey = CacheKey.updateLock(lockBase)

  await cacheService.setLock(lockBase)
  await cacheService.releaseLock(lockBase)

  const exists = await redis.exists(lockKey)
  t.is(exists, 0)
})

// ─── waitLock ──────────────────────────────────────────────────────────────

test.serial('waitLock (no lock)', async (t) => {
  const lockBase = 'cache_test:waitlock:none'
  const lockKey = CacheKey.updateLock(lockBase)
  await redis.del(lockKey)

  const result = await cacheService.waitLock(lockBase)
  t.is(result, null)
})

test.serial('waitLock (waits for lock release)', async (t) => {
  const key = 'cache_test:waitlock:withvalue'
  const lockKey = CacheKey.updateLock(key)
  const expected = { waited: true }

  await redis.del(key)
  await redis.del(lockKey)

  // Set the lock
  await redis.set(lockKey, '', 'EX', 60)

  // Schedule lock release and key write after a short delay
  setTimeout(async () => {
    await redis.set(key, JSON.stringify(expected), 'EX', 60)
    await redis.del(lockKey)
  }, 200)

  const result = await cacheService.waitLock(key)
  // waitLock returns the raw Redis string, not parsed JSON
  t.is(result, JSON.stringify(expected))

  await redis.del(key)
})

// ─── getOrCreateFromRedisCache ─────────────────────────────────────────────

test.serial('getOrCreateFromRedisCache (redis hit)', async (t) => {
  const key = 'cache_test:redis_cache:hit'
  const expected = { source: 'redis' }
  await redis.set(key, JSON.stringify(expected), 'EX', 60)

  let callCount = 0
  const result = await cacheService.getOrCreateFromRedisCache<typeof expected>(key, async () => {
    callCount++
    return { source: 'factory' }
  })

  t.deepEqual(result, expected)
  t.is(callCount, 0)

  await cacheService.remove(key)
})

test.serial('getOrCreateFromRedisCache (factory called on miss)', async (t) => {
  const key = 'cache_test:redis_cache:factory'
  await redis.del(key)

  let callCount = 0
  const result = await cacheService.getOrCreateFromRedisCache<{ n: number }>(key, async () => {
    callCount++
    return { n: 7 }
  })

  t.deepEqual(result, { n: 7 })
  t.is(callCount, 1)

  const stored = await redis.get(key)
  t.deepEqual(JSON.parse(stored!), { n: 7 })

  await cacheService.remove(key)
})
