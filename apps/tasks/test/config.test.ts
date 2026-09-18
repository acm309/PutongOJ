import test from 'ava'
import { loadJudgerConfig } from '../src/modules/judger/config.ts'
import { loadWorkerConfig } from '../src/modules/worker/config.ts'

test('loads judger defaults', (t) => {
  const config = loadJudgerConfig({})
  t.is(config.mongodbURL, 'mongodb://localhost:27017/oj')
  t.is(config.redisURL, 'redis://localhost:6379')
  t.is(config.sandboxEndpoint, 'http://localhost:5050')
  t.is(config.sandboxDataDir, '/app/data')
})

test('supports Redis urls with database indexes', (t) => {
  const config = loadJudgerConfig({
    PTOJ_REDIS_URL: 'redis://localhost:6380/15',
  })
  t.is(config.redisOptions.port, 6380)
  t.is(config.redisOptions.db, 15)
})

test('loads database and testcase paths', (t) => {
  const config = loadJudgerConfig({
    PTOJ_MONGODB_URL: 'mongodb://localhost:27018/putong-tasks-test',
    PTOJ_DATA_DIR: '/tmp/putong-data',
    PTOJ_SANDBOX_DATA_DIR: '/sandbox-data',
  })
  t.is(config.mongodbURL, 'mongodb://localhost:27018/putong-tasks-test')
  t.is(config.dataDir, '/tmp/putong-data')
  t.is(config.sandboxDataDir, '/sandbox-data')
})

test('loads worker defaults', (t) => {
  const config = loadWorkerConfig({})
  t.is(config.mongodbURL, 'mongodb://localhost:27017/oj')
  t.is(config.redisURL, 'redis://localhost:6379')
  t.true(config.uploadDir.endsWith('apps/server/public/uploads'))
})

test('loads worker upload directory', (t) => {
  const config = loadWorkerConfig({
    PTOJ_UPLOAD_DIR: '/tmp/putong-uploads',
  })
  t.is(config.uploadDir, '/tmp/putong-uploads')
})
