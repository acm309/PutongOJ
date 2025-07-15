import type { ObjectId } from 'mongoose'
import type { CourseDocument } from '../models/Course'
import type { UserDocument } from '../models/User'
import type { CourseRole, Paginated, PaginateOption } from '../types'
import type { CourseEntityEditable, CourseEntityLimited, CourseMemberEntity } from '../types/entity'
import Course from '../models/Course'
import CoursePerm from '../models/CoursePerm'
import User from '../models/User'
import { encrypt } from '../utils/constants'

export const courseRoleNone = Object.freeze({
  basic: false,
  viewTestcase: false,
  viewSolution: false,
  manageProblem: false,
  manageContest: false,
  manageCourse: false,
} as CourseRole)

export const courseRoleEntire = Object.freeze({
  basic: true,
  viewTestcase: true,
  viewSolution: true,
  manageProblem: true,
  manageContest: true,
  manageCourse: true,
} as CourseRole)

export async function findCourses (
  opt: PaginateOption & {},
): Promise<Paginated<CourseEntityLimited>> {
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

export async function getCourse (
  courseId: number,
): Promise<CourseDocument | undefined> {
  const course = await Course.findOne({ courseId })
  return course ?? undefined
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
): Promise<CourseDocument | undefined> {
  const course = await Course
    .findOneAndUpdate({ courseId }, opt, { new: true })
  return course ?? undefined
}

export async function findCourseMembers (
  course: ObjectId | string,
  opt: PaginateOption & {},
): Promise<Paginated<CourseMemberEntity>> {
  const { page, pageSize } = opt
  const filter = { course }
  const result = await CoursePerm.paginate(filter, {
    sort: { role: -1 },
    page,
    populate: { path: 'user', select: '-_id uid nick privilege' },
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id user role createdAt updatedAt',
  }) as any
  return result
}

export async function getCourseMember (
  course: ObjectId | string,
  userId: string,
): Promise<CourseMemberEntity | undefined> {
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return undefined
  }
  const member = await CoursePerm
    .findOne({ course, user: user.id })
    .lean()
  return {
    user: {
      uid: user.uid,
      nick: user.nick,
      privilege: user.privilege,
    },
    role: member?.role ?? courseRoleNone,
    createdAt: member?.createdAt ?? new Date(),
    updatedAt: member?.updatedAt ?? new Date(),
  }
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
    let { basic, viewTestcase, viewSolution, manageProblem, manageContest, manageCourse } = role

    basic = true
    manageContest ||= manageCourse
    manageProblem ||= manageCourse
    viewSolution ||= manageCourse
    viewTestcase ||= manageProblem || manageCourse

    return { basic, viewTestcase, viewSolution, manageProblem, manageContest, manageCourse }
  })(role))

  const coursePerm = await CoursePerm.findOneAndUpdate(
    { user: user.id, course },
    { user: user.id, course, role: parsedRole },
    { upsert: true, new: true },
  )

  return !!coursePerm
}

export async function removeCourseMember (
  course: ObjectId | string,
  userId: string,
): Promise<boolean> {
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return false
  }

  const coursePerm = await CoursePerm.findOneAndDelete({
    user: user.id,
    course,
  })

  return !!coursePerm
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
      const userPerm = await CoursePerm
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

const courseServices = {
  courseRoleNone,
  courseRoleEntire,
  findCourses,
  getCourse,
  createCourse,
  updateCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  removeCourseMember,
  getUserRole,
}

export default courseServices
