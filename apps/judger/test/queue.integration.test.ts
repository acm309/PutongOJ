import { JudgeStatus, Language, problemType } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { loadConfig } from '../src/config.ts'
import { RESULT_QUEUE_NAME, TASK_QUEUE_NAME } from '../src/constants.ts'
import { Scheduler } from '../src/queue/scheduler.ts'
import { integrationTest, sandboxEndpoint } from './helpers.ts'

integrationTest('processes a queued submission in order', async (t) => {
  const taskQueue = TASK_QUEUE_NAME
  const resultQueue = RESULT_QUEUE_NAME
  const config = {
    ...loadConfig({
      PTOJ_REDIS_URL: 'redis://127.0.0.1:6379/15',
      PTOJ_SANDBOX_ENDPOINT: sandboxEndpoint,
      PTOJ_DEBUG: '0',
    }),
    initConcurrent: 1,
  }
  const redis = new Redis(config.redisOptions)
  const scheduler = new Scheduler(config)

  try {
    await redis.del(taskQueue, resultQueue)
    await redis.rpush(taskQueue, JSON.stringify({
      sid: 42,
      timeLimit: 1000,
      memoryLimit: 32768,
      testcases: [
        {
          uuid: 'queue-testcase',
          input: { content: '1 2\n' },
          output: { content: '3\n' },
        },
      ],
      language: Language.Python,
      code: 'a, b = map(int, input().split())\nprint(a + b)\n',
      type: problemType.Traditional,
      additionCode: '',
    }))

    scheduler.start()
    const running = await redis.blpop(resultQueue, 10)
    const final = await redis.blpop(resultQueue, 30)

    t.truthy(running)
    t.truthy(final)
    const runningResult = JSON.parse(running![1])
    const finalResult = JSON.parse(final![1])
    t.is(runningResult.judge, JudgeStatus.RunningJudge)
    t.is(finalResult.judge, JudgeStatus.Accepted)
    t.is(finalResult.sid, 42)
  } finally {
    await scheduler.stop()
    await redis.del(taskQueue, resultQueue)
    await redis.quit()
  }
})
