import type { JudgeStatus as JudgeStatusValue, WebSocketDispatch, WebSocketMessage } from '@putongoj/shared'
import { JudgeStatus, WebSocketDispatchType, WebSocketMessageType } from '@putongoj/shared'
import { getDatabase } from '../config/postgres'
import redis from '../config/redis'
import logger from '../utils/logger'
import { distributeWork } from './helper'

const statusByJudge: Record<number, JudgeStatusValue> = {
  0: JudgeStatus.PENDING,
  1: JudgeStatus.RUNNING_JUDGE,
  2: JudgeStatus.COMPILE_ERROR,
  3: JudgeStatus.ACCEPTED,
  4: JudgeStatus.RUNTIME_ERROR,
  5: JudgeStatus.WRONG_ANSWER,
  6: JudgeStatus.TIME_LIMIT_EXCEEDED,
  7: JudgeStatus.MEMORY_LIMIT_EXCEEDED,
  8: JudgeStatus.OUTPUT_LIMIT_EXCEEDED,
  9: JudgeStatus.PRESENTATION_ERROR,
  10: JudgeStatus.SYSTEM_ERROR,
  11: JudgeStatus.REJUDGE_PENDING,
  12: JudgeStatus.SKIPPED,
}

function parseJudgeStatus (value: unknown): JudgeStatusValue | undefined {
  return typeof value === 'string' && Object.values(JudgeStatus).includes(value as JudgeStatusValue)
    ? value as JudgeStatusValue
    : undefined
}

async function updateResult (result: any) {
  const database = await getDatabase()
  const status = statusByJudge[result.judge] ?? parseJudgeStatus(result.status)
  if (!status) {
    logger.warn(`Submission <${result.sid}> received an unknown judge status`)
    return
  }
  const testcaseResults = result.testcases === undefined
    ? undefined
    : {
        deleteMany: {},
        createMany: {
          data: result.testcases.map((testcase: any) => ({
            testcaseId: testcase.uuid,
            status: statusByJudge[testcase.judge] ?? JudgeStatus.PENDING,
            timeUsedMs: testcase.time ?? 0,
            memoryUsedKb: testcase.memory ?? 0,
          })),
        },
      }
  const submission: any = await database.submission.update({
    where: { id: result.sid },
    data: {
      status,
      ...(result.time === undefined ? {} : { timeUsedMs: result.time }),
      ...(result.memory === undefined ? {} : { memoryUsedKb: result.memory }),
      ...(result.error === undefined ? {} : { errorMessage: result.error }),
      ...(testcaseResults === undefined ? {} : { testcaseResults }),
    } as any,
    include: { user: true },
  }).catch(() => null)
  if (!submission) {
    logger.warn(`Submission <${result.sid}> not found`)
    return
  }

  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.User,
    username: submission.user.username,
    message: {
      type: WebSocketMessageType.SubmissionResult,
      data: { submissionId: submission.id, status: submission.status },
    } as WebSocketMessage,
  }
  if (submission.status !== JudgeStatus.RUNNING_JUDGE) {
    await Promise.all([
      distributeWork('updateStatistic', `problem:${submission.problemId}`),
      distributeWork('updateStatistic', `user:${submission.userId}`),
      redis.publish('websocket:message', JSON.stringify(dispatch)),
    ])
  }
  if (submission.status === JudgeStatus.ACCEPTED) {
    await distributeWork('checkSimilarity', submission.id)
  }
}

async function main () {
  logger.info('Updater is running...')
  while (true) {
    try {
      const value = await redis.blpop('judger:result', 0)
      if (value) { await updateResult(JSON.parse(value[1])) }
    } catch (error) {
      logger.error(error)
    }
  }
}

void main()
