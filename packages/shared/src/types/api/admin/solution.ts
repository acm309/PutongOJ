import { z } from 'zod'
import { JudgeStatus, Language } from '@/consts/index.js'
import { stringToInt } from '../../codec.js'
import { SolutionModelSchema } from '../../model/index.js'
import {
  PaginatedSchema,
  PaginationSchema,
  SortOptionSchema,
} from '../utils.js'

export const AdminSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'createdAt', 'time', 'memory' ]).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  contest: stringToInt.pipe(z.union([ z.int().nonnegative(), z.literal(-1) ])).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type AdminSolutionListQuery = z.infer<typeof AdminSolutionListQuerySchema>

export const AdminSolutionListQueryResultSchema = PaginatedSchema(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  mid: SolutionModelSchema.shape.mid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type AdminSolutionListQueryResult = z.input<typeof AdminSolutionListQueryResultSchema>

export const AdminSolutionListExportQuerySchema = z.object({
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'createdAt', 'time', 'memory' ]).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  contest: stringToInt.pipe(z.union([ z.int().nonnegative(), z.literal(-1) ])).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type AdminSolutionListExportQuery = z.infer<typeof AdminSolutionListExportQuerySchema>

export const AdminSolutionListExportQueryResultSchema = z.array(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  mid: SolutionModelSchema.shape.mid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type AdminSolutionListExportQueryResult = z.input<typeof AdminSolutionListExportQueryResultSchema>
