import type { CourseRole } from '../entity.js'
import { z } from 'zod'
import { CourseVisibility } from '@/consts/index.js'
import { ProblemFieldsSchema } from '../fields/problem.js'
import { UserFieldsSchema } from '../fields/user.js'
import { PaginatedResultSchema, PaginationSchema } from './utils.js'

const CourseFieldsSchema = z.object({
  id: z.int().positive(),
  name: z.string().min(1).max(30),
  description: z.string().max(100),
  visibility: z.enum(CourseVisibility),
  joinCode: z.string().max(20),
})

const CourseRoleSchema = z.object({
  canAccess: z.boolean(),
  canViewTestcases: z.boolean(),
  canViewSubmissions: z.boolean(),
  canManageProblems: z.boolean(),
  canManageContests: z.boolean(),
  canManageCourse: z.boolean(),
}) satisfies z.ZodType<CourseRole>

export const CourseListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
})

export type CourseListQuery = z.infer<typeof CourseListQuerySchema>

export const CourseListQueryResultSchema = PaginatedResultSchema(z.object({
  id: CourseFieldsSchema.shape.id,
  name: CourseFieldsSchema.shape.name,
  description: CourseFieldsSchema.shape.description,
  visibility: CourseFieldsSchema.shape.visibility,
  canJoin: z.boolean(),
}))

export type CourseListQueryResult = z.input<typeof CourseListQueryResultSchema>

export const CourseItemListQuerySchema = z.object({
  keyword: z.string().max(30).default(''),
})

export type CourseItemListQuery = z.infer<typeof CourseItemListQuerySchema>

export const CourseItemListQueryResultSchema = z.array(z.object({
  id: CourseFieldsSchema.shape.id,
  name: CourseFieldsSchema.shape.name,
}))

export type CourseItemListQueryResult = z.input<typeof CourseItemListQueryResultSchema>

export const CourseDetailQueryResultSchema = z.object({
  id: CourseFieldsSchema.shape.id,
  name: CourseFieldsSchema.shape.name,
  description: CourseFieldsSchema.shape.description,
  visibility: CourseFieldsSchema.shape.visibility,
  joinCode: CourseFieldsSchema.shape.joinCode.optional(),
  canJoin: z.boolean(),
  role: CourseRoleSchema,
})

export type CourseDetailQueryResult = z.input<typeof CourseDetailQueryResultSchema>

export const CourseCreatePayloadSchema = z.object({
  name: CourseFieldsSchema.shape.name,
  description: CourseFieldsSchema.shape.description.default(''),
  visibility: CourseFieldsSchema.shape.visibility.default(CourseVisibility.PUBLIC),
})

export type CourseCreatePayload = z.infer<typeof CourseCreatePayloadSchema>

export const CourseUpdatePayloadSchema = z.object({
  name: CourseFieldsSchema.shape.name.optional(),
  description: CourseFieldsSchema.shape.description.optional(),
  visibility: CourseFieldsSchema.shape.visibility.optional(),
  joinCode: CourseFieldsSchema.shape.joinCode.optional(),
})

export type CourseUpdatePayload = z.infer<typeof CourseUpdatePayloadSchema>

export const CourseCreateResultSchema = z.object({
  id: CourseFieldsSchema.shape.id,
})

export type CourseCreateResult = z.input<typeof CourseCreateResultSchema>

export const CourseMutationResultSchema = z.object({
  success: z.boolean(),
})

export type CourseMutationResult = z.input<typeof CourseMutationResultSchema>

export const CourseMemberListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
})

export type CourseMemberListQuery = z.infer<typeof CourseMemberListQuerySchema>

export const CourseMemberQueryResultSchema = z.object({
  role: CourseRoleSchema,
  user: z.object({
    id: UserFieldsSchema.shape.id,
    username: UserFieldsSchema.shape.username,
    nickname: UserFieldsSchema.shape.nickname,
    privilege: UserFieldsSchema.shape.privilege,
  }),
  createdAt: UserFieldsSchema.shape.createdAt,
  updatedAt: UserFieldsSchema.shape.updatedAt,
})

export type CourseMemberQueryResult = z.input<typeof CourseMemberQueryResultSchema>

export const CourseMemberListQueryResultSchema = PaginatedResultSchema(CourseMemberQueryResultSchema)

export type CourseMemberListQueryResult = z.input<typeof CourseMemberListQueryResultSchema>

export const CourseMemberUpdatePayloadSchema = CourseRoleSchema

export type CourseMemberUpdatePayload = z.infer<typeof CourseMemberUpdatePayloadSchema>

export const CourseProblemAddPayloadSchema = z.object({
  problemIds: z.array(ProblemFieldsSchema.shape.id).min(1),
})

export type CourseProblemAddPayload = z.infer<typeof CourseProblemAddPayloadSchema>

export const CourseProblemMovePayloadSchema = z.object({
  beforePosition: z.int().positive(),
})

export type CourseProblemMovePayload = z.infer<typeof CourseProblemMovePayloadSchema>

export const CourseProblemAddResultSchema = z.object({
  added: z.int().nonnegative(),
})

export type CourseProblemAddResult = z.input<typeof CourseProblemAddResultSchema>
