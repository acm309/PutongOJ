import { z } from 'zod'
import { JUDGE_STATUS_TERMINAL } from '@/consts/index.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'
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
  title: ProblemModelSchema.shape.title,
  timeLimitMs: ProblemModelSchema.shape.timeLimitMs,
  memoryLimitKb: ProblemModelSchema.shape.memoryLimitKb,
  description: ProblemModelSchema.shape.description,
  inputFormat: ProblemModelSchema.shape.inputFormat,
  outputFormat: ProblemModelSchema.shape.outputFormat,
  sampleInput: ProblemModelSchema.shape.sampleInput,
  sampleOutput: ProblemModelSchema.shape.sampleOutput,
  hint: ProblemModelSchema.shape.hint,
  visibility: ProblemModelSchema.shape.visibility,
  judgeType: ProblemModelSchema.shape.judgeType,
  judgeCode: ProblemModelSchema.shape.judgeCode,
  tagIds: z.array(z.int().positive()),
})

export const ProblemCreatePayloadSchema = ProblemEditorFieldsSchema.extend({
  courseId: z.int().positive().optional(),
}).partial().extend({
  title: ProblemModelSchema.shape.title,
  timeLimitMs: ProblemModelSchema.shape.timeLimitMs.default(1000),
  memoryLimitKb: ProblemModelSchema.shape.memoryLimitKb.default(32768),
  description: ProblemModelSchema.shape.description.default(''),
  inputFormat: ProblemModelSchema.shape.inputFormat.default(''),
  outputFormat: ProblemModelSchema.shape.outputFormat.default(''),
  sampleInput: ProblemModelSchema.shape.sampleInput.default(''),
  sampleOutput: ProblemModelSchema.shape.sampleOutput.default(''),
  hint: ProblemModelSchema.shape.hint.default(''),
  visibility: ProblemModelSchema.shape.visibility.default('RESERVED'),
  judgeType: ProblemModelSchema.shape.judgeType.default('TRADITIONAL'),
  judgeCode: ProblemModelSchema.shape.judgeCode.default(''),
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
  status: SolutionModelSchema.shape.status.optional(),
  language: SolutionModelSchema.shape.language.optional(),
})

export type ProblemSolutionListQuery = z.infer<typeof ProblemSolutionListQuerySchema>

export const ProblemSolutionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: SolutionModelSchema.shape.id,
  userId: SolutionModelSchema.shape.userId,
  language: SolutionModelSchema.shape.language,
  status: SolutionModelSchema.shape.status,
  timeUsedMs: SolutionModelSchema.shape.timeUsedMs,
  memoryUsedKb: SolutionModelSchema.shape.memoryUsedKb,
  similarity: SolutionModelSchema.shape.similarity,
  createdAt: SolutionModelSchema.shape.createdAt,
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
