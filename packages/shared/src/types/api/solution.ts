import { z } from 'zod'
import { ContestFieldsSchema } from '../fields/contest.js'
import { ProblemFieldsSchema } from '../fields/problem.js'
import { SubmissionFieldsSchema } from '../fields/submission.js'

export const SolutionSubmitPayloadSchema = z.object({
  problemId: ProblemFieldsSchema.shape.id,
  contestId: ContestFieldsSchema.shape.id.optional(),
  language: SubmissionFieldsSchema.shape.language,
  sourceCode: SubmissionFieldsSchema.shape.sourceCode.min(8).max(16384),
})

export type SolutionSubmitPayload = z.infer<typeof SolutionSubmitPayloadSchema>

export const SolutionSubmitResultSchema = z.object({
  submissionId: SubmissionFieldsSchema.shape.id,
})

export type SolutionSubmitResult = z.input<typeof SolutionSubmitResultSchema>
