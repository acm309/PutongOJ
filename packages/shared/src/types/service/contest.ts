import { z } from 'zod'
import { ProblemModelSchema, UserModelSchema } from '../model/index.js'

export const ContestRanklistProblemSchema = z.object({
  problemId: ProblemModelSchema.shape.pid,
  failedCount: z.number(),
  pendingCount: z.number(),
  solvedAt: z.iso.datetime().optional(),
})

export type ContestRanklistProblem = z.input<typeof ContestRanklistProblemSchema>

export const ContestRanklistSchema = z.array(z.object({
  username: UserModelSchema.shape.uid,
  nickname: UserModelSchema.shape.nick,
  problems: z.array(ContestRanklistProblemSchema),
}))

export type ContestRanklist = z.input<typeof ContestRanklistSchema>
