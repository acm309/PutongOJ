import { z } from 'zod'
import { JudgeStatus } from '@/consts/index.js'
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

export const SubmissionDetailQueryResultSchema = z.object({
  id: SubmissionFieldsSchema.shape.id,
  problemId: SubmissionFieldsSchema.shape.problemId,
  contestId: SubmissionFieldsSchema.shape.contestId,
  userId: SubmissionFieldsSchema.shape.userId,
  user: z.object({
    id: z.int().positive(),
    username: z.string(),
    nickname: z.string(),
  }),
  language: SubmissionFieldsSchema.shape.language,
  status: SubmissionFieldsSchema.shape.status,
  timeUsedMs: SubmissionFieldsSchema.shape.timeUsedMs,
  memoryUsedKb: SubmissionFieldsSchema.shape.memoryUsedKb,
  errorMessage: SubmissionFieldsSchema.shape.errorMessage,
  similarity: SubmissionFieldsSchema.shape.similarity,
  similarSubmissionId: SubmissionFieldsSchema.shape.similarSubmissionId,
  sourceCode: SubmissionFieldsSchema.shape.sourceCode,
  testcaseResults: SubmissionFieldsSchema.shape.testcaseResults,
  createdAt: SubmissionFieldsSchema.shape.createdAt,
  updatedAt: SubmissionFieldsSchema.shape.updatedAt,
  similarSubmission: z.object({
    id: SubmissionFieldsSchema.shape.id,
    userId: SubmissionFieldsSchema.shape.userId,
    user: z.object({
      id: z.int().positive(),
      username: z.string(),
      nickname: z.string(),
    }),
    sourceCode: SubmissionFieldsSchema.shape.sourceCode,
    createdAt: SubmissionFieldsSchema.shape.createdAt,
  }).nullable(),
})

export type SubmissionDetailQueryResult = z.input<typeof SubmissionDetailQueryResultSchema>

export const SubmissionStatusUpdatePayloadSchema = z.object({
  status: z.union([
    z.literal(JudgeStatus.REJUDGE_PENDING),
    z.literal(JudgeStatus.SKIPPED),
  ]),
})

export type SubmissionStatusUpdatePayload = z.infer<typeof SubmissionStatusUpdatePayloadSchema>
