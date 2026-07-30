import { JudgeStatus } from '@putongoj/shared'
import levenshtein from 'fast-levenshtein'
import { getDatabase } from '../../config/postgres'
import logger from '../../utils/logger'

const normalize = (code: string) => code
  .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
  .replace(/[a-z_]\w*/gi, 'VAR')
  .replace(/\s+/g, ' ')
  .trim()

export default async function checkSimilarity (item: string) {
  const id = Number(item)
  const database = await getDatabase()
  const submission = await database.submission.findUnique({ where: { id } })
  if (!submission) { return }

  const candidates = await database.submission.findMany({
    where: {
      problemId: submission.problemId,
      userId: { not: submission.userId },
      createdAt: { lt: submission.createdAt },
      status: JudgeStatus.ACCEPTED,
    },
    select: { id: true, sourceCode: true },
  })
  let best = 0
  let bestId: number | null = null
  for (const candidate of candidates) {
    const distance = levenshtein.get(normalize(submission.sourceCode), normalize(candidate.sourceCode))
    const ratio = 1 - distance / Math.max(submission.sourceCode.length, candidate.sourceCode.length)
    if (ratio > best) {
      best = ratio
      bestId = candidate.id
    }
  }

  const similarity = Math.round(best * 100)
  if (similarity >= 70 && bestId) {
    await database.submission.update({ where: { id }, data: { similarity, similarSubmissionId: bestId } })
  }
  logger.info(`Submission <${id}> similarity=${similarity}%`)
}
