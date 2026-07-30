import { z } from 'zod'
import { ContestModelSchema } from '../model/contest.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'

export const SolutionSubmitPayloadSchema = z.object({
  problemId: ProblemModelSchema.shape.id,
  contestId: ContestModelSchema.shape.id.optional(),
  language: SolutionModelSchema.shape.language,
  sourceCode: SolutionModelSchema.shape.sourceCode.min(8).max(16384),
})

export type SolutionSubmitPayload = z.infer<typeof SolutionSubmitPayloadSchema>

export const SolutionSubmitResultSchema = z.object({
  submissionId: SolutionModelSchema.shape.id,
})

export type SolutionSubmitResult = z.input<typeof SolutionSubmitResultSchema>
