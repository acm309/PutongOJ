import test from 'ava'
import { loadConfig } from '../src/config.ts'

test('loads Python-compatible defaults', (t) => {
  const config = loadConfig({})
  t.is(config.redisURL, 'redis://localhost:6379')
  t.is(config.sandboxEndpoint, 'http://localhost:5050')
  t.is(config.initConcurrent, 1)
  t.true(config.debug)
})

test('supports Redis urls with database indexes', (t) => {
  const config = loadConfig({
    PTOJ_REDIS_URL: 'redis://localhost:6380/15',
  })
  t.is(config.redisOptions.port, 6380)
  t.is(config.redisOptions.db, 15)
})

test('rejects invalid concurrency', (t) => {
  t.throws(() => loadConfig({ PTOJ_INIT_CONCURRENT: '0' }))
  t.throws(() => loadConfig({ PTOJ_INIT_CONCURRENT: 'invalid' }))
})
