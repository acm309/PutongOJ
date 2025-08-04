import type { ObjectId } from 'mongoose'
import type { CourseDocument } from '../models/Course'
import type { UserDocument } from '../models/User'
import type { CourseRole, Paginated, PaginateOption } from '../types'
import type { CourseEntityEditable, CourseEntityItem, CourseEntityPreview, CourseMemberEntity, CourseMemberView, UserEntity } from '../types/entity'
import { escapeRegExp, omit } from 'lodash'
import Course from '../models/Course'
import CourseMember from '../models/CourseMember'
import User from '../models/User'
import { courseRoleEntire, courseRoleNone, encrypt } from '../utils/constants'

export async function findCourses (
  opt: PaginateOption & {},
): Promise<Paginated<CourseEntityPreview>> {
  const { page, pageSize } = opt
  const query: Record<string, unknown> = {}
  const result = await Course.paginate(query, {
    sort: { courseId: -1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id courseId name description encrypt',
  }) as any
  return result
}

export async function findCourseItems (
  keyword: string,
): Promise<CourseEntityItem[]> {
  const query: Record<string, any>[] = [
    { name: { $regex: new RegExp(escapeRegExp(keyword), 'i') } },
  ]
  if (Number.isInteger(Number(keyword))) {
    query.push({
      $expr: {
        $regexMatch: {
          input: { $toString: '$courseId' },
          regex: new RegExp(`^${escapeRegExp(keyword)}`, 'i'),
        },
      },
    })
  }
  const result = await Course.find(
    { $or: query },
    '-_id courseId name',
    { sort: { courseId: -1 }, limit: 10 },
  ).lean()
  return result
}

export async function getCourse (
  courseId: number,
): Promise<CourseDocument | null> {
  const course = await Course.findOne({ courseId })
  return course ?? null
}

export async function createCourse (
  opt: CourseEntityEditable,
): Promise<CourseDocument> {
  const course = new Course(opt)
  await course.save()
  return course
}

export async function updateCourse (
  courseId: number,
  opt: Partial<CourseEntityEditable>,
): Promise<CourseDocument | null> {
  const course = await Course
    .findOneAndUpdate({ courseId }, opt, { new: true })
  return course ?? null
}

export async function findCourseMembers (
  course: ObjectId | string,
  opt: PaginateOption & {},
): Promise<Paginated<CourseMemberView>> {
  const { page, pageSize } = opt
  const filter = { course }
  const sort = {
    'role.manageCourse': -1,
    'role.manageContest': -1,
    'role.manageProblem': -1,
    'role.viewSolution': -1,
    'role.viewTestcase': -1,
    'createdAt': -1,
  }

  type QueryItem
    = Partial<Pick<CourseMemberEntity, 'role' | 'createdAt' | 'updatedAt'>>
      & {
        user: Partial<Pick<UserEntity, 'uid' | 'nick' | 'privilege'>> | null
      }
  const result = await CourseMember.paginate(filter, {
    sort,
    page,
    populate: { path: 'user', select: '-_id uid nick privilege' },
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id user role createdAt updatedAt',
  }) as unknown as Paginated<QueryItem>

  return {
    ...result,
    docs: result.docs.map((doc: QueryItem) => CourseMember.toView(
      omit(doc, [ 'user' ]), doc.user,
    )),
  } as Paginated<CourseMemberView>
}

export async function getCourseMember (
  course: ObjectId | string,
  userId: string,
): Promise<CourseMemberView | null> {
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return null
  }
  const member = await CourseMember
    .findOne({ course, user: user.id })
    .lean()
  return CourseMember.toView(member, user)
}

export async function updateCourseMember (
  course: ObjectId | string,
  userId: string,
  role: CourseRole,
): Promise<boolean> {
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return false
  }

  const parsedRole: CourseRole = Object.assign({}, ((role) => {
    let {
      basic, viewTestcase, viewSolution,
      manageProblem, manageContest, manageCourse,
    } = role

    basic = true
    manageContest ||= manageCourse
    manageProblem ||= manageCourse
    viewSolution ||= manageCourse
    viewTestcase ||= manageProblem || manageCourse

    return {
      basic, viewTestcase, viewSolution,
      manageProblem, manageContest, manageCourse,
    }
  })(role))

  const courseMember = await CourseMember.findOneAndUpdate(
    { user: user.id, course },
    { user: user.id, course, role: parsedRole },
    { upsert: true, new: true },
  )

  return !!courseMember
}

export async function removeCourseMember (
  course: ObjectId | string,
  userId: string,
): Promise<boolean> {
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return false
  }

  const courseMember = await CourseMember.findOneAndDelete({
    user: user.id,
    course,
  })

  return !!courseMember
}

export async function getUserRole (
  profile: UserDocument | undefined,
  course: CourseDocument,
): Promise<CourseRole> {
  let role: CourseRole = Object.assign({}, courseRoleNone)

  if (profile) {
    if (profile.isAdmin) {
      role = Object.assign(role, courseRoleEntire)
    } else {
      const userPerm = await CourseMember
        .findOne({
          user: profile.id,
          course: course.id,
        })
        .lean()
      if (userPerm) {
        role = Object.assign(role, userPerm.role)
      }
    }
  }

  if (course.encrypt === encrypt.Public) {
    role.basic = true
  }
  return role
}

const courseService = {
  courseRoleNone,
  courseRoleEntire,
  findCourses,
  findCourseItems,
  getCourse,
  createCourse,
  updateCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  removeCourseMember,
  getUserRole,
}

export default courseService
