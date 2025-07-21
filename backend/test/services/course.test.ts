import type { CourseDocument } from '../../src/models/Course'
import type { CourseEntityEditable } from '../../src/types/entity'
import test from 'ava'
import User from '../../src/models/User'
import courseService from '../../src/services/course'
import { userSeeds } from '../seeds/user'
import '../../src/config/db'

const testCourse: CourseEntityEditable = {
  name: 'C Programming',
  description: 'A course about C programming',
  encrypt: 1,
}
const testUser = userSeeds.ScourseCstu as { uid: string }
const adminUser = userSeeds.admin as { uid: string }
const testContext = {
  course: undefined as CourseDocument | undefined,
}

const { courseRoleNone, courseRoleEntire } = courseService
const courseRoleBasic = Object.freeze({
  ...courseRoleNone,
  basic: true,
})

test('findCourses', async (t) => {
  const result = await courseService.findCourses({
    page: 1,
    pageSize: 1,
  })

  t.truthy(result)
  t.is(result.docs.length, 1)
  t.true(result.pages > 1)
  t.deepEqual(
    Object.keys(result.docs[0]).sort(),
    [ 'courseId', 'name', 'description', 'encrypt' ].sort())
  t.is(typeof result.docs[0].courseId, 'number')
  t.is(typeof result.docs[0].name, 'string')
  t.is(typeof result.docs[0].description, 'string')
  t.is(typeof result.docs[0].encrypt, 'number')
})

test('createCourse (name too short)', async (t) => {
  const course = { ...testCourse, name: 'CP' }
  await t.throwsAsync(courseService.createCourse(course))
})

test('createCourse (name too long)', async (t) => {
  const course = { ...testCourse, name: 'C'.repeat(31) }
  await t.throwsAsync(courseService.createCourse(course))
})

test('createCourse (description too long)', async (t) => {
  const course = { ...testCourse, description: 'A'.repeat(101) }
  await t.throwsAsync(courseService.createCourse(course))
})

test.serial('createCourse (serial)', async (t) => {
  const course = await courseService.createCourse(testCourse)

  t.truthy(course)
  t.is(typeof course.courseId, 'number')
  t.is(course.name, testCourse.name)
  t.is(course.description, testCourse.description)
  t.is(course.encrypt, testCourse.encrypt)

  testContext.course = course
})

test('getCourse (non-existent course)', async (t) => {
  const course = await courseService.getCourse(0)
  t.is(course, undefined)
})

test.serial('getCourse (serial)', async (t) => {
  const courseId = testContext.course?.courseId
  if (!courseId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const course = await courseService.getCourse(courseId)

  t.truthy(course)
  t.is(course?.courseId, courseId)
  t.is(course?.name, testCourse.name)
  t.is(course?.description, testCourse.description)
  t.is(course?.encrypt, testCourse.encrypt)
  t.true(course?.isPublic)
  t.false(course?.isPrivate)
})

test('updateCourse (non-existent course)', async (t) => {
  const result = await courseService.updateCourse(0, {})
  t.is(result, undefined)
})

test.serial('updateCourse (serial)', async (t) => {
  const courseId = testContext.course?.courseId
  if (!courseId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const updatedCourse = await courseService.updateCourse(
    courseId,
    {
      name: 'Advanced C Programming',
      description: 'An advanced course about C programming',
    })

  t.truthy(updatedCourse)
  t.is(updatedCourse?.courseId, courseId)
  t.is(updatedCourse?.name, 'Advanced C Programming')
  t.is(updatedCourse?.description, 'An advanced course about C programming')
})

test.serial('updateCourseMember (non-existent user)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.updateCourseMember(
    courseObjectId,
    'ScourseNonExist',
    courseRoleEntire,
  )

  t.false(result)
})

test.serial('updateCourseMember (serial)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.updateCourseMember(
    courseObjectId,
    testUser.uid,
    courseRoleEntire,
  )

  t.true(result)
})

test.serial('getCourseMember (non-existent user)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.getCourseMember(
    courseObjectId,
    'ScourseNonExist',
  )

  t.is(result, undefined)
})

test.serial('getCourseMember (serial)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.getCourseMember(
    courseObjectId,
    testUser.uid as string,
  )
  if (!result) {
    return t.fail('Failed to retrieve course member')
  }

  t.truthy(result)
  t.is(result.user.uid, testUser.uid)
  t.deepEqual(result.role, courseRoleEntire)
})

test.serial('getCourseMember (non-member user)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.getCourseMember(
    courseObjectId,
    adminUser.uid,
  )
  if (!result) {
    return t.fail('Failed to retrieve course member for admin user')
  }

  t.truthy(result)
  t.is(result.user.uid, adminUser.uid)
  t.deepEqual(result.role, courseRoleNone)
})

test.serial('findCourseMembers (serial)', async (t) => {
  const courseId = testContext.course?.id
  if (!courseId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const members = await courseService.findCourseMembers(courseId, {
    page: 1,
    pageSize: 1,
  })

  t.truthy(members)
  t.is(members.limit, 1)
  t.is(members.page, 1)
  t.is(members.pages, 1)
  t.is(members.total, 1)
  t.is(members.docs.length, 1)
  t.is(members.docs[0].user.uid, testUser.uid)
  t.deepEqual(members.docs[0].role, courseRoleEntire)
  t.is(members.docs[0].createdAt instanceof Date, true)
  t.is(members.docs[0].updatedAt instanceof Date, true)
})

test.serial('removeCourseMember (non-existent user)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.removeCourseMember(
    courseObjectId,
    'ScourseNonExist',
  )

  t.false(result)
})

test.serial('getUserRole (entire)', async (t) => {
  const user = await User.findOne({ uid: testUser.uid })
  if (!user) {
    return t.fail('Test user does not exist')
  }
  if (!testContext.course) {
    return t.fail('Previous test did not create a course successfully')
  }
  const role = await courseService.getUserRole(user, testContext.course)

  t.deepEqual(role, courseRoleEntire)
})

test.serial('removeCourseMember (serial)', async (t) => {
  const courseObjectId = testContext.course?.id
  if (!courseObjectId) {
    return t.fail('Previous test did not create a course successfully')
  }
  const result = await courseService.removeCourseMember(
    courseObjectId,
    testUser.uid,
  )

  t.true(result)
})

test.serial('getUserRole (basic)', async (t) => {
  const user = await User.findOne({ uid: testUser.uid })
  if (!user) {
    return t.fail('Test user does not exist')
  }
  if (!testContext.course) {
    return t.fail('Previous test did not create a course successfully')
  }
  const role = await courseService.getUserRole(user, testContext.course)

  t.deepEqual(role, courseRoleBasic)
})

test.serial('getUserRole (admin has entire)', async (t) => {
  const user = await User.findOne({ uid: adminUser.uid })
  if (!user) {
    return t.fail('Admin user does not exist')
  }
  if (!testContext.course) {
    return t.fail('Previous test did not create a course successfully')
  }
  const role = await courseService.getUserRole(user, testContext.course)

  t.deepEqual(role, courseRoleEntire)
})
