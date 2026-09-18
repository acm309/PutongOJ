import test from 'ava'
import { loadConfig } from '../src/config.ts'

test('loads Python-compatible defaults', (t) => {
  const config = loadConfig({})
  t.is(config.mongodbURL, 'mongodb://localhost:27017/oj')
  t.is(config.redisURL, 'redis://localhost:6379')
  t.is(config.sandboxEndpoint, 'http://localhost:5050')
  t.is(config.sandboxDataDir, '/app/data')
  t.true(config.debug)
})

test('supports Redis urls with database indexes', (t) => {
  const config = loadConfig({
    PTOJ_REDIS_URL: 'redis://localhost:6380/15',
  })
  t.is(config.redisOptions.port, 6380)
  t.is(config.redisOptions.db, 15)
})

test('loads database and testcase paths', (t) => {
  const config = loadConfig({
    PTOJ_MONGODB_URL: 'mongodb://localhost:27018/putong-judger-test',
    PTOJ_DATA_DIR: '/tmp/putong-data',
    PTOJ_SANDBOX_DATA_DIR: '/sandbox-data',
  })
  t.is(config.mongodbURL, 'mongodb://localhost:27018/putong-judger-test')
  t.is(config.dataDir, '/tmp/putong-data')
  t.is(config.sandboxDataDir, '/sandbox-data')
})
