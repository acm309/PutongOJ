import { JudgeStatus } from '@putongoj/shared'
import levenshtein from 'fast-levenshtein'
import Solution from '../../models/Solution'
import logger from '../../utils/logger'

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
    logger.error(`Solution <${sid}> not found`)
    return
  }
  const start_time = new Date().getTime()

  const solutions = await Solution.find({
    pid: solution.pid,
    uid: { $ne: solution.uid },
    create: { $lt: solution.create },
    judge: JudgeStatus.Accepted,
  }, {
    code: 1, sid: 1,
  }).lean().exec()

  const code = codeNormalize(solution.code)
  const result = { sim: 0, sim_s_id: 0 }
  for (const s of solutions) {
    const sim = similarity(code, codeNormalize(s.code))
    if (sim > result.sim) {
      result.sim = sim
      result.sim_s_id = s.sid
    }
  }
  result.sim = Math.round(result.sim * 100)

  const end_time = new Date().getTime()
  logger.info(
    `Solution <${sid}> has similarity with <${result.sim_s_id}>`
    + ` (${result.sim}%) in ${end_time - start_time}ms`
    + ` (${solutions.length} solutions checked)`)

  if (result.sim < 70) { return }

  solution.sim = result.sim
  solution.sim_s_id = result.sim_s_id
  await solution.save()
}

export default checkSimilarity
