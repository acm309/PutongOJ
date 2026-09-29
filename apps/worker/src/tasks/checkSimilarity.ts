import type { Types } from '@putong-oj/db'
import { Solution } from '@putong-oj/db'
import { JudgeStatus } from '@putong-oj/shared'
import levenshtein from 'fast-levenshtein'
import { createLogger } from '../logger.ts'

const logger = createLogger('worker.check-similarity')

function codeNormalize (code: string): string {
  return code
    .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
    .replace(/[a-z_]\w*/gi, 'VAR')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity (a: string, b: string): number {
  return 1 - (levenshtein.get(a, b) / Math.max(a.length, b.length))
}

async function checkSimilarity (item: string) {
  const sid = Number.parseInt(item, 10)
  const solution = await Solution.findOne({ sid }).exec()
  if (!solution) {
    logger.error({ solutionId: sid }, 'Solution not found')
    return
  }
  const start_time = Date.now()

  const solutions = await Solution.find({
    pid: solution.pid,
    uid: { $ne: solution.uid },
    create: { $lt: solution.create },
    judge: JudgeStatus.Accepted,
  }, {
    code: 1, sid: 1,
  }).lean().exec()

  const code = codeNormalize(solution.code)
  const result = {
    similarity: 0,
    similarSolution: null as Types.ObjectId | null,
  }
  for (const s of solutions) {
    const similarityScore = similarity(code, codeNormalize(s.code))
    if (similarityScore > result.similarity) {
      result.similarity = similarityScore
      result.similarSolution = s._id
    }
  }
  result.similarity = Math.round(result.similarity * 100)

  const end_time = Date.now()
  logger.info(
    {
      checkedSolutions: solutions.length,
      elapsedMs: end_time - start_time,
      similarSolutionId: result.similarSolution?.toString(),
      similarity: result.similarity,
      solutionId: sid,
    },
    'Solution similarity checked',
  )

  if (result.similarity < 70) { return }

  solution.similarity = result.similarity
  solution.similarSolution = result.similarSolution
  await solution.save()
}

export default checkSimilarity
