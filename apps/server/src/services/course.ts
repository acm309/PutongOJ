import type { CourseVisibility, Prisma } from '@putongoj/db'
import type { CourseEntity, CourseRole, PaginatedResult } from '@putongoj/shared'
import type { PaginateOption } from '../types'
import { CourseVisibility as CourseVisibilityEnum, UserPrivilege } from '@putongoj/shared'
import { getDatabase } from '../config/postgres'
import { toCourseRole } from '../persistence/mappers'
import logger from '../utils/logger'

const courseRoleNoAccess: CourseRole = {
  canAccess: false,
  canViewTestcases: false,
  canViewSubmissions: false,
  canManageProblems: false,
  canManageContests: false,
  canManageCourse: false,
}

const courseRolePublicAccess: CourseRole = {
  ...courseRoleNoAccess,
  canAccess: true,
}

const courseRoleFullAccess: CourseRole = {
  canAccess: true,
  canViewTestcases: true,
  canViewSubmissions: true,
  canManageProblems: true,
  canManageContests: true,
  canManageCourse: true,
}

export interface CourseMemberView {
  role: CourseRole
  user: {
    id: number
    username: string
    nickname: string
    privilege: string
  }
  createdAt: Date
  updatedAt: Date
}

function normalizeRole (role: Partial<CourseRole>): CourseRole {
  const canManageCourse = role.canManageCourse === true
  const canManageProblems = role.canManageProblems === true || canManageCourse
  const canManageContests = role.canManageContests === true || canManageCourse
  const canViewTestcases = role.canViewTestcases === true || canManageProblems || canManageCourse
  const canViewSubmissions = role.canViewSubmissions === true || canManageCourse
  return {
    canAccess: true,
    canViewTestcases,
    canViewSubmissions,
    canManageProblems,
    canManageContests,
    canManageCourse,
  }
}

function toCourseEntity (course: {
  id: number
  name: string
  description: string
  visibility: CourseVisibility
  joinCode: string
  createdAt: Date
  updatedAt: Date
}): CourseEntity {
  return course
}

export async function findCourses (opt: PaginateOption): Promise<PaginatedResult<CourseEntity>> {
  const database = await getDatabase()
  const [ items, total ] = await Promise.all([
    database.course.findMany({
      orderBy: { id: 'desc' },
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.course.count(),
  ])
  return {
    items: items.map(toCourseEntity),
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function findCourseItems (keyword: string): Promise<Pick<CourseEntity, 'id' | 'name'>[]> {
  const database = await getDatabase()
  const id = Number(keyword)
  const courses = await database.course.findMany({
    where: {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        ...(Number.isInteger(id) ? [ { id: { gte: id, lt: id + 1 } } ] : []),
      ],
    },
    select: { id: true, name: true },
    orderBy: { id: 'desc' },
    take: 10,
  })
  return courses
}

export async function getCourse (courseId: number) {
  const database = await getDatabase()
  return await database.course.findUnique({ where: { id: courseId } })
}

export async function createCourse (data: Pick<CourseEntity, 'name' | 'description' | 'visibility' | 'joinCode'>) {
  const database = await getDatabase()
  return await database.course.create({ data })
}

export async function updateCourse (
  courseId: number,
  data: Partial<Pick<CourseEntity, 'name' | 'description' | 'visibility' | 'joinCode'>>,
) {
  const database = await getDatabase()
  try {
    return await database.course.update({ where: { id: courseId }, data })
  } catch (error) {
    logger.warn(`Failed to update course <Course:${courseId}>: ${String(error)}`)
    return null
  }
}

export async function findCourseMembers (courseId: number, opt: PaginateOption): Promise<PaginatedResult<CourseMemberView>> {
  const database = await getDatabase()
  const where = { courseId }
  const [ items, total ] = await Promise.all([
    database.courseMember.findMany({
      where,
      include: { user: true },
      orderBy: [
        { canManageCourse: 'desc' },
        { canManageContests: 'desc' },
        { canManageProblems: 'desc' },
        { canViewSubmissions: 'desc' },
        { canViewTestcases: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.courseMember.count({ where }),
  ])
  return {
    items: items.map(member => ({
      role: toCourseRole(member),
      user: {
        id: member.user.id,
        username: member.user.username,
        nickname: member.user.nickname,
        privilege: member.user.privilege,
      },
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    })),
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function getCourseMember (courseId: number, username: string): Promise<CourseMemberView | null> {
  const database = await getDatabase()
  const member = await database.courseMember.findFirst({
    where: { courseId, user: { username: { equals: username, mode: 'insensitive' } } },
    include: { user: true },
  })
  if (!member) { return null }
  return {
    role: toCourseRole(member),
    user: {
      id: member.user.id,
      username: member.user.username,
      nickname: member.user.nickname,
      privilege: member.user.privilege,
    },
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  }
}

export async function updateCourseMember (courseId: number, userId: number, role: Partial<CourseRole>): Promise<boolean> {
  const database = await getDatabase()
  const normalized = normalizeRole(role)
  await database.courseMember.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId, ...normalized },
    update: normalized,
  })
  return true
}

export async function joinCourse (courseId: number, userId: number): Promise<boolean> {
  return await updateCourseMember(courseId, userId, { canAccess: true })
}

export async function removeCourseMember (courseId: number, userId: number): Promise<boolean> {
  const database = await getDatabase()
  const result = await database.courseMember.deleteMany({ where: { courseId, userId } })
  return result.count > 0
}

export async function getUserRole (userId: number | null | undefined, course: CourseEntity): Promise<CourseRole> {
  if (userId === undefined || userId === null) {
    return course.visibility === CourseVisibilityEnum.PUBLIC
      ? courseRolePublicAccess
      : courseRoleNoAccess
  }
  const database = await getDatabase()
  const user = await database.user.findUnique({ where: { id: userId }, select: { privilege: true } })
  if (user?.privilege === UserPrivilege.ADMIN || user?.privilege === UserPrivilege.ROOT) {
    return courseRoleFullAccess
  }
  const member = await database.courseMember.findUnique({ where: { courseId_userId: { courseId: course.id, userId } } })
  if (member) { return toCourseRole(member) }
  return course.visibility === CourseVisibilityEnum.PUBLIC
    ? courseRolePublicAccess
    : courseRoleNoAccess
}

export async function addCourseProblem (courseId: number, problemId: number): Promise<boolean> {
  const database = await getDatabase()
  const last = await database.courseProblem.findFirst({
    where: { courseId },
    orderBy: [ { sort: 'desc' }, { updatedAt: 'asc' } ],
    select: { sort: true },
  })
  const sort = Number(last?.sort ?? 0) + 1
  await database.courseProblem.upsert({
    where: { courseId_problemId: { courseId, problemId } },
    create: { courseId, problemId, sort },
    update: { sort },
  })
  return true
}

export async function moveCourseProblem (courseId: number, problemId: number, beforePosition: number): Promise<boolean> {
  if (!Number.isInteger(beforePosition) || beforePosition < 1) { return false }
  const database = await getDatabase()
  const orderBy: Prisma.CourseProblemOrderByWithRelationInput[] = [
    { sort: 'asc' },
    { updatedAt: 'desc' },
  ]
  const [ atPosition, before, last ] = await Promise.all([
    database.courseProblem.findMany({
      where: { courseId },
      orderBy,
      skip: beforePosition - 1,
      take: 1,
    }),
    beforePosition > 1
      ? database.courseProblem.findMany({
          where: { courseId },
          orderBy,
          skip: beforePosition - 2,
          take: 1,
        })
      : Promise.resolve([]),
    database.courseProblem.findFirst({
      where: { courseId },
      orderBy: [ { sort: 'desc' }, { updatedAt: 'asc' } ],
    }),
  ])
  let sort = 0
  if (last) {
    if (atPosition[0]) {
      sort = before[0]
        ? (Number(atPosition[0].sort) + Number(before[0].sort)) / 2
        : Number(atPosition[0].sort) - 1
    } else {
      sort = before[0]
        ? Number(before[0].sort) + 1
        : Number(last.sort) + 1
    }
  }
  const result = await database.courseProblem.updateMany({ where: { courseId, problemId }, data: { sort } })
  return result.count > 0
}

export async function rearrangeCourseProblems (courseId: number): Promise<void> {
  const database = await getDatabase()
  const problems = await database.courseProblem.findMany({ where: { courseId }, orderBy: [ { sort: 'asc' }, { updatedAt: 'desc' } ] })
  await database.$transaction(problems.map((problem, index) => database.courseProblem.update({
    where: { courseId_problemId: { courseId, problemId: problem.problemId } },
    data: { sort: index + 1 },
  })))
}

export async function removeCourseProblem (courseId: number, problemId: number): Promise<boolean> {
  const database = await getDatabase()
  const result = await database.courseProblem.deleteMany({ where: { courseId, problemId } })
  return result.count > 0
}

export async function hasProblemRole (userId: number, problemId: number, role: keyof CourseRole): Promise<boolean> {
  const database = await getDatabase()
  const roleColumn: Record<keyof CourseRole, keyof Prisma.CourseMemberWhereInput> = {
    canAccess: 'canAccess',
    canViewTestcases: 'canViewTestcases',
    canViewSubmissions: 'canViewSubmissions',
    canManageProblems: 'canManageProblems',
    canManageContests: 'canManageContests',
    canManageCourse: 'canManageCourse',
  }
  const membership = await database.courseMember.findFirst({
    where: {
      userId,
      [roleColumn[role]]: true,
      course: { problems: { some: { problemId } } },
    },
    select: { userId: true },
  })
  return membership !== null
}

const courseService = {
  findCourses,
  findCourseItems,
  getCourse,
  createCourse,
  updateCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  joinCourse,
  removeCourseMember,
  getUserRole,
  addCourseProblem,
  moveCourseProblem,
  rearrangeCourseProblems,
  removeCourseProblem,
  hasProblemRole,
} as const

export default courseService
