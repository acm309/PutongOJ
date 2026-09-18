import type {
  JudgerResult,
  JudgerTask,
  ProblemEntity,
  SolutionEntity,
} from '@putong-oj/shared'
import type { JudgerConfig } from '../config.ts'
import path from 'node:path'
import { Problem, Solution } from '@putong-oj/db'
import { JudgerTaskSchema, ProblemTestcaseListQueryResultSchema } from '@putong-oj/shared'
import fse from 'fs-extra'
import { createLogger } from '../../../logger.ts'

type SolutionRecord = Pick<SolutionEntity, 'sid' | 'pid' | 'language' | 'code'>
type ProblemRecord = Pick<ProblemEntity, 'pid' | 'time' | 'memory' | 'type' | 'code'>

const logger = createLogger('judger.submission')

export function buildJudgerTask (
  solution: SolutionRecord,
  problem: ProblemRecord,
  testcases: Array<{ uuid: string }>,
  sandboxDataDir: string,
): JudgerTask {
  return JudgerTaskSchema.parse({
    sid: solution.sid,
    timeLimit: problem.time,
    memoryLimit: problem.memory,
    testcases: testcases.map(testcase => ({
      uuid: testcase.uuid,
      input: {
        src: path.join(sandboxDataDir, String(problem.pid), `${testcase.uuid}.in`),
      },
      output: {
        src: path.join(sandboxDataDir, String(problem.pid), `${testcase.uuid}.out`),
      },
    })),
    language: solution.language,
    code: solution.code,
    type: problem.type,
    additionCode: problem.code,
  })
}

async function loadTestcases (
  pid: number,
  dataDir: string,
): Promise<Array<{ uuid: string }>> {
  const file = path.resolve(dataDir, String(pid), 'meta.json')
  const raw = await fse.pathExists(file)
    ? await fse.readJson(file)
    : { testcases: [] }
  return ProblemTestcaseListQueryResultSchema.parse(raw.testcases ?? [])
}

export async function loadJudgerTask (
  id: string,
  config: JudgerConfig,
): Promise<JudgerTask | undefined> {
  const solution = await Solution
    .findOne({ _id: id })
    .select('sid pid language code')
    .lean()
    .exec() as unknown as SolutionRecord | null
  if (!solution) {
    logger.warn(`Solution <${id}> not found`)
    return undefined
  }

  const problem = await Problem
    .findOne({ pid: solution.pid })
    .select('pid time memory type code')
    .lean()
    .exec() as unknown as ProblemRecord | null
  if (!problem) {
    throw new Error(`Problem <${solution.pid}> for solution <${id}> not found`)
  }

  const testcases = await loadTestcases(problem.pid, config.dataDir)
  return buildJudgerTask(
    solution,
    problem,
    testcases,
    config.sandboxDataDir,
  )
}

export async function saveJudgerResult (
  id: string,
  result: JudgerResult,
): Promise<void> {
  const updated = await Solution.updateOne(
    { _id: id },
    {
      $set: {
        time: result.time,
        memory: result.memory,
        testcases: result.testcases,
        judge: result.judge,
        error: result.error,
      },
    },
    { runValidators: true },
  ).exec()

  if (updated.matchedCount === 0) {
    logger.warn(`Solution <${id}> not found while saving result`)
  }
}
