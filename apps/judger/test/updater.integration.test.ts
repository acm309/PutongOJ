import { connectMongoose, disconnectMongoose, Solution } from '@putong-oj/db'
import { JudgeStatus, Language, WEBSOCKET_CHANNEL, WebSocketDispatchType, WebSocketMessageType } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { loadJudgerConfig } from '../src/config.ts'
import { RESULT_QUEUE_NAME } from '../src/constants.ts'
import { Updater } from '../src/queue/updater.ts'
import { integrationTest, mongodbURL } from './helpers.ts'

integrationTest('publishes result notifications and queues follow-up jobs', async (t) => {
  const sid = Date.now()
  const config = loadJudgerConfig({
    PTOJ_MONGODB_URL: mongodbURL,
    PTOJ_REDIS_URL: 'redis://127.0.0.1:6379/15',
  })
  const redis = new Redis(config.redisOptions)
  const subscriber = new Redis(config.redisOptions)
  const updater = new Updater(config)
  const statisticQueue = 'worker:updateStatistic'
  const similarityQueue = 'worker:checkSimilarity'
  let processing: Promise<void> | undefined

  try {
    await connectMongoose({ uri: config.mongodbURL })
    await Solution.deleteMany({ sid })
    await redis.del(
      RESULT_QUEUE_NAME,
      statisticQueue,
      `${statisticQueue}:set`,
      similarityQueue,
      `${similarityQueue}:set`,
    )

    const solution = await Solution.create({
      sid,
      pid: 999_999,
      uid: 'updater-integration',
      code: 'print("hello")\n',
      length: 15,
      language: Language.Python,
      judge: JudgeStatus.Accepted,
      create: new Date(),
    })
    const solutionId = solution._id.toString()

    await subscriber.subscribe(WEBSOCKET_CHANNEL)
    const messagePromise = new Promise<unknown>((resolve) => {
      subscriber.once('message', (_channel, message) => {
        resolve(JSON.parse(message))
      })
    })

    await redis.rpush(RESULT_QUEUE_NAME, solutionId)
    processing = updater.run()

    const [ dispatch, problemTask, userTask, similarityTask ] = await Promise.all([
      messagePromise,
      redis.blpop(statisticQueue, 10),
      redis.blpop(statisticQueue, 10),
      redis.blpop(similarityQueue, 10),
    ])

    t.deepEqual(dispatch, {
      type: WebSocketDispatchType.User,
      username: 'updater-integration',
      message: {
        type: WebSocketMessageType.SubmissionResult,
        data: {
          solutionId: sid,
          judgeStatus: JudgeStatus.Accepted,
        },
      },
    })
    t.true([ problemTask, userTask ].some(task => task?.[1] === 'problem:999999'))
    t.true([ problemTask, userTask ].some(task => task?.[1] === 'user:updater-integration'))
    t.deepEqual(similarityTask, [ similarityQueue, String(sid) ])
  } finally {
    updater.stop()
    await processing
    try {
      await Promise.all([
        redis.del(
          RESULT_QUEUE_NAME,
          statisticQueue,
          `${statisticQueue}:set`,
          similarityQueue,
          `${similarityQueue}:set`,
        ),
        subscriber.unsubscribe(WEBSOCKET_CHANNEL),
        Solution.deleteMany({ sid }),
      ])
      await Promise.all([
        redis.quit(),
        subscriber.quit(),
      ])
    } finally {
      await disconnectMongoose()
    }
  }
})
