import { z } from 'zod'
import { JUDGE_STATUS_TERMINAL } from '@/consts/index.js'
import { ProblemFieldsSchema } from '../fields/problem.js'
import { SubmissionFieldsSchema } from '../fields/submission.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

const ProblemStatisticsBucketSchema = z.object({
  lowerBound: z.int().nonnegative(),
  upperBound: z.int().nonnegative(),
  count: z.int().nonnegative(),
})

export const ProblemStatisticsQueryResultSchema = z.object({
  judgeCounts: z.array(z.object({
    status: z.enum(JUDGE_STATUS_TERMINAL),
    count: z.int().nonnegative(),
  })),
  timeDistribution: z.array(ProblemStatisticsBucketSchema),
  memoryDistribution: z.array(ProblemStatisticsBucketSchema),
})

export type ProblemStatisticsQueryResult = z.input<typeof ProblemStatisticsQueryResultSchema>

const ProblemEditorFieldsSchema = z.object({
  title: ProblemFieldsSchema.shape.title,
  timeLimitMs: ProblemFieldsSchema.shape.timeLimitMs,
  memoryLimitKb: ProblemFieldsSchema.shape.memoryLimitKb,
  description: ProblemFieldsSchema.shape.description,
  inputFormat: ProblemFieldsSchema.shape.inputFormat,
  outputFormat: ProblemFieldsSchema.shape.outputFormat,
  sampleInput: ProblemFieldsSchema.shape.sampleInput,
  sampleOutput: ProblemFieldsSchema.shape.sampleOutput,
  hint: ProblemFieldsSchema.shape.hint,
  visibility: ProblemFieldsSchema.shape.visibility,
  judgeType: ProblemFieldsSchema.shape.judgeType,
  judgeCode: ProblemFieldsSchema.shape.judgeCode,
  tagIds: z.array(z.int().positive()),
})

export const ProblemCreatePayloadSchema = ProblemEditorFieldsSchema.extend({
  courseId: z.int().positive().optional(),
}).partial().extend({
  title: ProblemFieldsSchema.shape.title,
  timeLimitMs: ProblemFieldsSchema.shape.timeLimitMs.default(1000),
  memoryLimitKb: ProblemFieldsSchema.shape.memoryLimitKb.default(32768),
  description: ProblemFieldsSchema.shape.description.default(''),
  inputFormat: ProblemFieldsSchema.shape.inputFormat.default(''),
  outputFormat: ProblemFieldsSchema.shape.outputFormat.default(''),
  sampleInput: ProblemFieldsSchema.shape.sampleInput.default(''),
  sampleOutput: ProblemFieldsSchema.shape.sampleOutput.default(''),
  hint: ProblemFieldsSchema.shape.hint.default(''),
  visibility: ProblemFieldsSchema.shape.visibility.default('RESERVED'),
  judgeType: ProblemFieldsSchema.shape.judgeType.default('TRADITIONAL'),
  judgeCode: ProblemFieldsSchema.shape.judgeCode.default(''),
  tagIds: z.array(z.int().positive()).default([]),
})

export type ProblemCreatePayload = z.infer<typeof ProblemCreatePayloadSchema>

export const ProblemUpdatePayloadSchema = ProblemEditorFieldsSchema.partial()

export type ProblemUpdatePayload = z.infer<typeof ProblemUpdatePayloadSchema>

export const ProblemSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'timeUsedMs', 'memoryUsedKb']).default('createdAt'),
  user: z.string().max(30).optional(),
  status: SubmissionFieldsSchema.shape.status.optional(),
  language: SubmissionFieldsSchema.shape.language.optional(),
})

export type ProblemSolutionListQuery = z.infer<typeof ProblemSolutionListQuerySchema>

export const ProblemSolutionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: SubmissionFieldsSchema.shape.id,
  userId: SubmissionFieldsSchema.shape.userId,
  language: SubmissionFieldsSchema.shape.language,
  status: SubmissionFieldsSchema.shape.status,
  timeUsedMs: SubmissionFieldsSchema.shape.timeUsedMs,
  memoryUsedKb: SubmissionFieldsSchema.shape.memoryUsedKb,
  similarity: SubmissionFieldsSchema.shape.similarity,
  createdAt: SubmissionFieldsSchema.shape.createdAt,
}))

export type ProblemSolutionListQueryResult = z.input<typeof ProblemSolutionListQueryResultSchema>

export const ProblemTestcaseListQueryResultSchema = z.array(z.object({
  uuid: z.string(),
}))

export type ProblemTestcaseListQueryResult = z.input<typeof ProblemTestcaseListQueryResultSchema>

export const ProblemTestcaseCreatePayloadSchema = z.object({
  input: z.string(),
  output: z.string(),
})

export type ProblemTestcaseCreatePayload = z.infer<typeof ProblemTestcaseCreatePayloadSchema>
