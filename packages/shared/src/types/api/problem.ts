import { z } from 'zod'
import {
  JUDGE_STATUS_TERMINAL,
  JudgeStatus,
  Language,
  limitation,
  problemType,
  status,
} from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'
import { TagModelSchema } from '../model/tag.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

const ProblemTagSchema = z.object({
  tagId: TagModelSchema.shape.tagId,
  name: TagModelSchema.shape.name,
  color: TagModelSchema.shape.color,
})

export const ProblemListQuerySchema = z.object({
  page: stringToInt.pipe(z.union([ z.literal(-1), z.int().positive() ])).default(1),
  pageSize: stringToInt.pipe(z.int().positive()).default(30),
  course: stringToInt.pipe(z.int().positive()).optional(),
  type: z.enum([ 'title', 'tag', 'pid' ]).optional(),
  content: z.string().max(80).optional(),
})

export type ProblemListQuery = z.infer<typeof ProblemListQuerySchema>

export const ProblemListQueryResultSchema = z.object({
  list: PaginatedSchema(z.object({
    pid: ProblemModelSchema.shape.pid,
    title: ProblemModelSchema.shape.title,
    status: z.enum(status),
    type: z.enum(problemType),
    submit: z.int().nonnegative(),
    solve: z.int().nonnegative(),
    tags: z.array(ProblemTagSchema),
    isOwner: z.boolean(),
  })),
  solved: z.array(ProblemModelSchema.shape.pid),
})

export type ProblemListQueryResult = z.input<typeof ProblemListQueryResultSchema>

export const ProblemItemListQuerySchema = z.object({
  keyword: z.string().max(80).default(''),
  course: stringToInt.pipe(z.int().positive()).optional(),
})

export type ProblemItemListQuery = z.infer<typeof ProblemItemListQuerySchema>

export const ProblemItemListQueryResultSchema = z.array(z.object({
  pid: ProblemModelSchema.shape.pid,
  title: ProblemModelSchema.shape.title,
}))

export type ProblemItemListQueryResult = z.input<typeof ProblemItemListQueryResultSchema>

export const ProblemDetailQueryResultSchema = z.object({
  pid: ProblemModelSchema.shape.pid,
  title: ProblemModelSchema.shape.title,
  time: ProblemModelSchema.shape.time,
  memory: ProblemModelSchema.shape.memory,
  status: z.enum(status),
  description: ProblemModelSchema.shape.description,
  input: ProblemModelSchema.shape.input,
  output: ProblemModelSchema.shape.output,
  in: ProblemModelSchema.shape.in,
  out: ProblemModelSchema.shape.out,
  hint: ProblemModelSchema.shape.hint,
  type: z.enum(problemType).optional(),
  code: ProblemModelSchema.shape.code.optional(),
  tags: z.array(ProblemTagSchema),
  isOwner: z.boolean(),
})

export type ProblemDetailQueryResult = z.input<typeof ProblemDetailQueryResultSchema>

const ProblemEditableFieldsSchema = z.object({
  title: ProblemModelSchema.shape.title.max(80),
  time: z.int().min(100).max(limitation.time),
  memory: z.int().min(32768).max(limitation.memory),
  status: z.enum(status),
  description: z.string(),
  input: z.string(),
  output: z.string(),
  in: z.string(),
  out: z.string(),
  hint: z.string(),
  type: z.enum(problemType),
  code: z.string(),
})

export const ProblemCreatePayloadSchema = ProblemEditableFieldsSchema.partial().extend({
  title: ProblemModelSchema.shape.title.max(80),
  time: z.int().min(100).max(limitation.time).default(1000),
  memory: z.int().min(32768).max(limitation.memory).default(32768),
  status: z.enum(status).default(status.Reserve),
  description: z.string().default(''),
  input: z.string().default(''),
  output: z.string().default(''),
  in: z.string().default(''),
  out: z.string().default(''),
  hint: z.string().default(''),
  type: z.enum(problemType).default(problemType.Traditional),
  code: z.string().default(''),
  course: z.int().positive().optional(),
})

export type ProblemCreatePayload = z.input<typeof ProblemCreatePayloadSchema>

export const ProblemUpdatePayloadSchema = ProblemEditableFieldsSchema.partial().extend({
  tags: z.array(ProblemTagSchema.shape.tagId).optional(),
})

export type ProblemUpdatePayload = z.infer<typeof ProblemUpdatePayloadSchema>

export const ProblemCreateResultSchema = z.object({
  pid: ProblemModelSchema.shape.pid,
})

export type ProblemCreateResult = z.input<typeof ProblemCreateResultSchema>

export const ProblemUpdateResultSchema = z.object({
  pid: ProblemModelSchema.shape.pid,
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
    judge: z.union(JUDGE_STATUS_TERMINAL.map(status => z.literal(status))),
    count: z.int().nonnegative(),
  })),
  timeDistribution: z.array(ProblemStatisticsBucketSchema),
  memoryDistribution: z.array(ProblemStatisticsBucketSchema),
})

export type ProblemStatisticsQueryResult = z.input<typeof ProblemStatisticsQueryResultSchema>

export const ProblemSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'createdAt', 'time', 'memory' ]).default('createdAt'),
  user: z.string().max(30).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type ProblemSolutionListQuery = z.infer<typeof ProblemSolutionListQuerySchema>

export const ProblemSolutionListQueryResultSchema = PaginatedSchema(z.object({
  sid: SolutionModelSchema.shape.sid,
  uid: SolutionModelSchema.shape.uid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type ProblemSolutionListQueryResult = z.input<typeof ProblemSolutionListQueryResultSchema>

export const ProblemTestcaseListQueryResultSchema = z.array(z.object({
  uuid: z.string(),
}))

export type ProblemTestcaseListQueryResult = z.input<typeof ProblemTestcaseListQueryResultSchema>

export const ProblemTestcaseCreatePayloadSchema = z.object({
  in: z.string(),
  out: z.string(),
})

export type ProblemTestcaseCreatePayload = z.infer<typeof ProblemTestcaseCreatePayloadSchema>
