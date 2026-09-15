import { z } from 'zod'
import { JUDGE_STATUS_TERMINAL, JudgeStatus, Language } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { SolutionModelSchema } from '../model/solution.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

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
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
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
