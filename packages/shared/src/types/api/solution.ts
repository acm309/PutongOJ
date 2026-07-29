import { z } from 'zod'
import { ContestModelSchema } from '../model/contest.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'

export const SolutionSubmitPayloadSchema = z.object({
  problem: ProblemModelSchema.shape.pid.int().positive(),
  contest: ContestModelSchema.shape.contestId.int().positive().optional(),
  language: SolutionModelSchema.shape.language,
  code: SolutionModelSchema.shape.code.min(8).max(16384),
})

export type SolutionSubmitPayload = z.infer<typeof SolutionSubmitPayloadSchema>

export const SolutionSubmitResultSchema = z.object({
  solution: SolutionModelSchema.shape.sid,
})

export type SolutionSubmitResult = z.input<typeof SolutionSubmitResultSchema>
