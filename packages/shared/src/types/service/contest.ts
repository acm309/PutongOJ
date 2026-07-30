import { z } from 'zod'
import { ProblemFieldsSchema, UserFieldsSchema } from '../fields/index.js'

export const ContestRanklistProblemSchema = z.object({
  problemId: ProblemFieldsSchema.shape.id,
  failedCount: z.number(),
  pendingCount: z.number(),
  solvedAt: z.iso.datetime().optional(),
})

export type ContestRanklistProblem = z.input<typeof ContestRanklistProblemSchema>

export const ContestRanklistSchema = z.array(z.object({
  username: UserFieldsSchema.shape.username,
  nickname: UserFieldsSchema.shape.nickname,
  problems: z.array(ContestRanklistProblemSchema),
}))

export type ContestRanklist = z.input<typeof ContestRanklistSchema>
