import { z } from 'zod'
import { JUDGE_STATUS_TERMINAL, ProblemVisibility, TagColor } from '@/consts/index.js'
import { ProblemFieldsSchema } from '../fields/problem.js'
import { SubmissionFieldsSchema } from '../fields/submission.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

const ProblemListItemSchema = z.object({
  id: ProblemFieldsSchema.shape.id,
  title: ProblemFieldsSchema.shape.title,
  timeLimitMs: ProblemFieldsSchema.shape.timeLimitMs,
  memoryLimitKb: ProblemFieldsSchema.shape.memoryLimitKb,
  visibility: ProblemFieldsSchema.shape.visibility,
  judgeType: ProblemFieldsSchema.shape.judgeType,
  ownerId: ProblemFieldsSchema.shape.ownerId,
  submitterCount: z.int().nonnegative(),
  solverCount: z.int().nonnegative(),
  tags: z.array(z.object({
    id: z.int().positive(),
    name: z.string(),
    color: z.enum(TagColor),
  })),
  isOwner: z.boolean(),
})

export const ProblemListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  searchField: z.enum(['title', 'tag', 'id']).optional(),
  search: z.string().max(80).optional(),
  courseId: z.coerce.number().int().positive().optional(),
})

export type ProblemListQuery = z.infer<typeof ProblemListQuerySchema>

export const ProblemListQueryResultSchema = z.object({
  items: z.array(ProblemListItemSchema),
  page: z.int().positive(),
  pageSize: z.int().positive(),
  total: z.int().nonnegative(),
  solvedProblemIds: z.array(ProblemFieldsSchema.shape.id),
})

export type ProblemListQueryResult = z.input<typeof ProblemListQueryResultSchema>

export const ProblemItemListQuerySchema = z.object({
  keyword: z.string().max(80).default(''),
  courseId: z.coerce.number().int().positive().optional(),
})

export type ProblemItemListQuery = z.infer<typeof ProblemItemListQuerySchema>

export const ProblemItemListQueryResultSchema = z.array(z.object({
  id: ProblemFieldsSchema.shape.id,
  title: ProblemFieldsSchema.shape.title,
}))

export type ProblemItemListQueryResult = z.input<typeof ProblemItemListQueryResultSchema>

export const ProblemDetailQueryResultSchema = z.object({
  id: ProblemFieldsSchema.shape.id,
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
  judgeCode: ProblemFieldsSchema.shape.judgeCode.optional(),
  ownerId: ProblemFieldsSchema.shape.ownerId,
  statistics: z.object({
    submitterCount: z.int().nonnegative(),
    solverCount: z.int().nonnegative(),
  }),
  tags: z.array(z.object({
    id: z.int().positive(),
    name: z.string(),
    color: z.enum(TagColor),
  })),
  isOwner: z.boolean(),
  createdAt: ProblemFieldsSchema.shape.createdAt,
  updatedAt: ProblemFieldsSchema.shape.updatedAt,
})

export type ProblemDetailQueryResult = z.input<typeof ProblemDetailQueryResultSchema>

export const ProblemCreateResultSchema = z.object({
  id: ProblemFieldsSchema.shape.id,
})

export type ProblemCreateResult = z.input<typeof ProblemCreateResultSchema>

export const ProblemUpdateResultSchema = z.object({
  id: ProblemFieldsSchema.shape.id.nullable(),
  success: z.boolean(),
})

export type ProblemUpdateResult = z.input<typeof ProblemUpdateResultSchema>

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
  visibility: ProblemFieldsSchema.shape.visibility.default(ProblemVisibility.RESERVED),
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
  user: z.object({
    id: z.int().positive(),
    username: z.string(),
    nickname: z.string(),
  }),
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
