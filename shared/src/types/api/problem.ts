import { z } from 'zod'
import { JudgeStatus, Language } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { SolutionModelSchema } from '../model/solution.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

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
  in: z.string().optional(),
  out: z.string().optional(),
})

export type ProblemTestcaseCreatePayload = z.infer<typeof ProblemTestcaseCreatePayloadSchema>
