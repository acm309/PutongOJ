import { z } from 'zod'
import { JudgeStatus, Language } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { SolutionModelSchema } from '../model/solution.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const ContestSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type ContestSolutionListQuery = z.infer<typeof ContestSolutionListQuerySchema>

export const ContestSolutionListQueryResultSchema = PaginatedSchema(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type ContestSolutionListQueryResult = z.input<typeof ContestSolutionListQueryResultSchema>

export const ContestSolutionListExportQuerySchema = z.object({
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type ContestSolutionListExportQuery = z.infer<typeof ContestSolutionListExportQuerySchema>

export const ContestSolutionListExportQueryResultSchema = z.array(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type ContestSolutionListExportQueryResult = z.input<typeof ContestSolutionListExportQueryResultSchema>
