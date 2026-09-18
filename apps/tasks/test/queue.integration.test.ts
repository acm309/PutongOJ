import path from 'node:path'
import { connectMongoose, disconnectMongoose, Problem, Solution } from '@putong-oj/db'
import { JudgeStatus, Language } from '@putong-oj/shared'
import fse from 'fs-extra'
import { Redis } from 'ioredis'
import { loadJudgerConfig } from '../src/modules/judger/config.ts'
import { RESULT_QUEUE_NAME, TASK_QUEUE_NAME } from '../src/modules/judger/constants.ts'
import { Processor } from '../src/modules/judger/queue/processor.ts'
import { integrationTest, mongodbURL, sandboxEndpoint } from './helpers.ts'

integrationTest('processes a queued submission in order', async (t) => {
  const taskQueue = TASK_QUEUE_NAME
  const resultQueue = RESULT_QUEUE_NAME
  const dataDir = process.env.PTOJ_DATA_DIR?.trim()
    || path.resolve(import.meta.dirname, '../../server/data')
  const sandboxDataDir = process.env.PTOJ_SANDBOX_DATA_DIR?.trim() || '/app/data'
  const pid = 999_999
  const sid = Date.now()
  const testcaseUUID = `queue-testcase-${sid}`
  const testcaseDir = path.resolve(dataDir, String(pid))
  const config = {
    ...loadJudgerConfig({
      PTOJ_MONGODB_URL: mongodbURL,
      PTOJ_REDIS_URL: 'redis://127.0.0.1:6379/15',
      PTOJ_SANDBOX_ENDPOINT: sandboxEndpoint,
      PTOJ_DATA_DIR: dataDir,
      PTOJ_SANDBOX_DATA_DIR: sandboxDataDir,
    }),
  }
  const redis = new Redis(config.redisOptions)
  const processor = new Processor(config)
  let processing: Promise<void> | undefined

  try {
    await connectMongoose({ uri: config.mongodbURL })
    await Promise.all([
      Problem.deleteMany({ pid }),
      Solution.deleteMany({ sid }),
      fse.remove(testcaseDir),
    ])
    await Promise.all([
      fse.outputFile(path.join(testcaseDir, `${testcaseUUID}.in`), '1 2\n'),
      fse.outputFile(path.join(testcaseDir, `${testcaseUUID}.out`), '3\n'),
      fse.outputJson(path.join(testcaseDir, 'meta.json'), {
        testcases: [ { uuid: testcaseUUID } ],
      }),
    ])
    await Problem.create({
      pid,
      title: 'Tasks queue integration',
      time: 1000,
      memory: 32768,
    })
    const queuedSolution = await Solution.create({
      sid,
      pid,
      uid: 'tasks-integration',
      code: 'a, b = map(int, input().split())\nprint(a + b)\n',
      length: 47,
      language: Language.Python,
    })
    const solutionId = queuedSolution._id.toString()

    await redis.del(taskQueue, resultQueue)
    await redis.rpush(taskQueue, solutionId)

    processing = processor.run()
    const running = await redis.blpop(resultQueue, 10)
    const final = await redis.blpop(resultQueue, 30)

    t.truthy(running)
    t.truthy(final)
    t.is(running![1], solutionId)
    t.is(final![1], solutionId)

    const solution = await Solution.findOne({ sid }).lean().exec()
    t.is(solution?.judge, JudgeStatus.Accepted)
    t.is(solution?.testcases.length, 1)
    t.is(solution?.testcases[0]?.uuid, testcaseUUID)
    t.is(solution?.testcases[0]?.judge, JudgeStatus.Accepted)
  } finally {
    processor.stop()
    await processing
    try {
      await Promise.all([
        redis.del(taskQueue, resultQueue),
        Problem.deleteMany({ pid }),
        Solution.deleteMany({ sid }),
        fse.remove(testcaseDir),
      ])
      await redis.quit()
    } finally {
      await disconnectMongoose()
    }
  }
})
