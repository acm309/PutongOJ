import test from 'ava'
import { getDatabase } from '../../src/config/postgres'
import courseService from '../../src/services/course'
import { userSeeds } from '../seeds/user'

const roleEntire = {
  canAccess: true,
  canViewTestcases: true,
  canViewSubmissions: true,
  canManageProblems: true,
  canManageContests: true,
  canManageCourse: true,
}
const context: { courseId?: number } = {}

test.serial('creates and updates a course using semantic PostgreSQL fields', async (t) => {
  const course = await courseService.createCourse({
    name: 'C Programming', description: 'A course about C programming', visibility: 'PUBLIC', joinCode: '',
  })
  context.courseId = course.id
  t.true(course.id > 0)
  t.is(course.visibility, 'PUBLIC')

  const updated = await courseService.updateCourse(course.id, { visibility: 'PRIVATE', joinCode: 'join-c' })
  t.is(updated?.visibility, 'PRIVATE')
  t.is(updated?.joinCode, 'join-c')
})

test.serial('maintains explicit course memberships and decimal problem ordering', async (t) => {
  const courseId = context.courseId
  if (!courseId) { return t.fail('course not created') }
  const database = await getDatabase()
  const user = await database.user.findUnique({ where: { username: userSeeds.ScourseCstu.username } })
  if (!user) { return t.fail('seed user not found') }

  t.true(await courseService.updateCourseMember(courseId, user.id, roleEntire))
  const member = await courseService.getCourseMember(courseId, user.id)
  t.is(member?.user.id, user.id)
  t.deepEqual(member?.role, roleEntire)

  await courseService.addCourseProblem(courseId, 1000)
  await courseService.addCourseProblem(courseId, 1001)
  t.true(await courseService.moveCourseProblem(courseId, 1001, 1))
  await courseService.rearrangeCourseProblems(courseId)
  const problems = await database.courseProblem.findMany({ where: { courseId }, orderBy: { sort: 'asc' } })
  t.deepEqual(problems.map(problem => problem.problemId), [ 1001, 1000 ])
  t.true(await courseService.hasProblemRole(user.id, 1000, 'canManageProblems'))
})

test.serial('public courses are readable without implicit memberships', async (t) => {
  const database = await getDatabase()
  const course = await courseService.getCourse(1)
  if (!course) { return t.fail('public seed course missing') }
  const user = await database.user.findUnique({ where: { username: userSeeds.primaryuser.username } })
  if (!user) { return t.fail('seed user missing') }

  const role = await courseService.getUserRole(user.id, course)
  t.true(role.canAccess)
  const membership = await database.courseMember.findUnique({ where: { courseId_userId: { courseId: course.id, userId: user.id } } })
  t.is(membership, null)
})
