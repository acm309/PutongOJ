import type { CourseRole } from '../entity.js'
import { z } from 'zod'
import { encrypt } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { ProblemModelSchema } from '../model/problem.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedSchema, PaginationSchema } from './utils.js'

export const CourseRoleSchema = z.object({
  basic: z.boolean(),
  viewTestcase: z.boolean(),
  viewSolution: z.boolean(),
  manageProblem: z.boolean(),
  manageContest: z.boolean(),
  manageCourse: z.boolean(),
}) satisfies z.ZodType<CourseRole>

const CourseEncryptSchema = z.union([
  z.literal(encrypt.Public),
  z.literal(encrypt.Private),
])

const CourseFieldsSchema = z.object({
  courseId: z.int().positive(),
  name: z.string().min(3).max(30),
  description: z.string().max(100),
  encrypt: CourseEncryptSchema,
  joinCode: z.string().max(20),
})

export const CourseListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(5),
})

export type CourseListQuery = z.infer<typeof CourseListQuerySchema>

export const CourseListQueryResultSchema = PaginatedSchema(z.object({
  courseId: CourseFieldsSchema.shape.courseId,
  name: CourseFieldsSchema.shape.name,
  description: CourseFieldsSchema.shape.description,
  encrypt: CourseFieldsSchema.shape.encrypt,
}))

export type CourseListQueryResult = z.input<typeof CourseListQueryResultSchema>

export const CourseItemListQuerySchema = z.object({
  keyword: z.string().max(80).default(''),
})

export type CourseItemListQuery = z.infer<typeof CourseItemListQuerySchema>

export const CourseItemListQueryResultSchema = z.array(z.object({
  courseId: CourseFieldsSchema.shape.courseId,
  name: CourseFieldsSchema.shape.name,
}))

export type CourseItemListQueryResult = z.input<typeof CourseItemListQueryResultSchema>

export const CourseDetailQueryResultSchema = z.object({
  courseId: CourseFieldsSchema.shape.courseId,
  name: CourseFieldsSchema.shape.name,
  description: CourseFieldsSchema.shape.description,
  encrypt: CourseFieldsSchema.shape.encrypt,
  joinCode: CourseFieldsSchema.shape.joinCode.optional(),
  canJoin: z.boolean(),
  role: CourseRoleSchema,
})

export type CourseDetailQueryResult = z.input<typeof CourseDetailQueryResultSchema>

export const CourseCreatePayloadSchema = z.object({
  name: CourseFieldsSchema.shape.name.trim(),
  description: CourseFieldsSchema.shape.description.trim().default(''),
  encrypt: CourseFieldsSchema.shape.encrypt.default(encrypt.Public),
})

export type CourseCreatePayload = z.input<typeof CourseCreatePayloadSchema>

export const CourseUpdatePayloadSchema = z.object({
  name: CourseFieldsSchema.shape.name.trim().optional(),
  description: CourseFieldsSchema.shape.description.trim().optional(),
  encrypt: CourseFieldsSchema.shape.encrypt.optional(),
  joinCode: CourseFieldsSchema.shape.joinCode.trim().optional(),
})

export type CourseUpdatePayload = z.infer<typeof CourseUpdatePayloadSchema>

export const CourseJoinPayloadSchema = z.object({
  joinCode: CourseFieldsSchema.shape.joinCode.trim().default(''),
})

export type CourseJoinPayload = z.infer<typeof CourseJoinPayloadSchema>

export const CourseCreateResultSchema = z.object({
  courseId: CourseFieldsSchema.shape.courseId,
})

export type CourseCreateResult = z.input<typeof CourseCreateResultSchema>

export const CourseMutationResultSchema = z.object({
  success: z.boolean(),
})

export type CourseMutationResult = z.input<typeof CourseMutationResultSchema>

export const CourseMemberListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: stringToInt.pipe(z.int().positive().max(200)).default(30),
})

export type CourseMemberListQuery = z.infer<typeof CourseMemberListQuerySchema>

export const CourseMemberQueryResultSchema = z.object({
  role: CourseRoleSchema,
  user: z.object({
    uid: UserModelSchema.shape.uid,
    nick: UserModelSchema.shape.nick,
    privilege: UserModelSchema.shape.privilege,
  }),
  createdAt: z.int().nonnegative(),
  updatedAt: z.int().nonnegative(),
})

export type CourseMemberQueryResult = z.input<typeof CourseMemberQueryResultSchema>

export const CourseMemberListQueryResultSchema = PaginatedSchema(CourseMemberQueryResultSchema)

export type CourseMemberListQueryResult = z.input<typeof CourseMemberListQueryResultSchema>

export const CourseMemberUpdatePayloadSchema = z.object({
  role: CourseRoleSchema,
})

export type CourseMemberUpdatePayload = z.infer<typeof CourseMemberUpdatePayloadSchema>

export const CourseProblemAddPayloadSchema = z.object({
  problemIds: z.array(ProblemModelSchema.shape.pid.int().positive()).min(1),
})

export type CourseProblemAddPayload = z.infer<typeof CourseProblemAddPayloadSchema>

export const CourseProblemMovePayloadSchema = z.object({
  beforePos: z.int().positive().default(1),
})

export type CourseProblemMovePayload = z.infer<typeof CourseProblemMovePayloadSchema>

export const CourseProblemAddResultSchema = z.object({
  success: z.boolean(),
  added: z.int().nonnegative(),
})

export type CourseProblemAddResult = z.input<typeof CourseProblemAddResultSchema>
