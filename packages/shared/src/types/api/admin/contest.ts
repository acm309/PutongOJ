import { z } from 'zod'
import { TITLE_LENGTH_MAX } from '@/consts/index.js'
import { stringToInt } from '../../codec.js'
import { ContestModelSchema } from '../../model/index.js'
import {
  PaginatedSchema,
  PaginationSchema,
  SortOptionSchema,
} from '../utils.js'

export const AdminContestListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'contestId', 'createdAt', 'updatedAt', 'startsAt', 'endsAt' ]).default('createdAt'),
  contestId: stringToInt.pipe(z.int().positive()).optional(),
  title: z.string().max(TITLE_LENGTH_MAX).optional(),
  // -1 represents contests that are not associated with a course.
  course: stringToInt.pipe(z.union([ z.int().nonnegative(), z.literal(-1) ])).optional(),
  isHidden: z.stringbool().optional(),
  isPublic: z.stringbool().optional(),
  isLocked: z.stringbool().optional(),
})

export type AdminContestListQuery = z.infer<typeof AdminContestListQuerySchema>

export const AdminContestListQueryResultSchema = PaginatedSchema(z.object({
  contestId: ContestModelSchema.shape.contestId,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  isHidden: ContestModelSchema.shape.isHidden,
  isLocked: ContestModelSchema.shape.isLocked,
  isPublic: ContestModelSchema.shape.isPublic,
  course: z.object({
    courseId: z.int().positive(),
    name: z.string(),
  }).nullable(),
  createdAt: ContestModelSchema.shape.createdAt,
  updatedAt: ContestModelSchema.shape.updatedAt,
}))

export type AdminContestListQueryResult = z.input<typeof AdminContestListQueryResultSchema>
