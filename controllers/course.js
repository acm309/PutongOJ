const only = require('only')
const { encrypt, coursePermission } = require('../config')
const Course = require('../models/Course')
const CoursePermission = require('../models/CoursePermission')
const { isAdmin } = require('../utils/helper')

const roleFields = [
  'basic', 'viewTestcase', 'viewSolution',
  'manageProblem', 'manageContest', 'manageCourse' ]
const reprRole = permission =>
  roleFields.reduce((acc, field) => {
    acc[field] = (
      permission
      & coursePermission[field.charAt(0).toUpperCase() + field.slice(1)]
    ) !== 0
    return acc
  }, {})

/**
 * 课程预加载中间件
 */
const preload = async (ctx, next) => {
  const id = Number(ctx.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return ctx.throw(400, 'Invalid course ID')
  }
  const course = await Course.findOne({ id }).exec()
  if (!course) {
    return ctx.throw(404, 'Course not found')
  }

  const { profile } = ctx.state
  let permission = isAdmin(ctx.session.profile)
    ? coursePermission.Entire
    : coursePermission.None

  if (!isAdmin(ctx.session.profile)) {
    const userPermission = await CoursePermission.findOne({
      user: profile._id,
      course: course._id,
    }).lean().exec()
    if (userPermission) {
      permission = userPermission.role
    }
  }
  if (course.encrypt === encrypt.Public) {
    permission |= coursePermission.Basic
  }

  ctx.state.course = course
  ctx.state.courseRole = reprRole(permission)
  await next()
}

/**
 * 课程权限要求中间件
 */
const role = (role) => {
  return async (ctx, next) => {
    const { courseRole } = ctx.state
    if (courseRole[role] === true) {
      await next()
    } else {
      ctx.throw(403, 'Permission denied')
    }
  }
}

/**
 * 查询课程列表
 */
const findCourses = async (ctx) => {
  const opt = ctx.request.query
  const page = Math.max(Number.parseInt(opt.page) || 1, 1)
  const pageSize = Math.max(Math.min(Number.parseInt(opt.pageSize) || 5, 100), 1)

  const list = await Course.paginate({}, {
    sort: { id: -1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id id name description encrypt',
  })
  ctx.body = list
}

/**
 * 查询课程详情
 */
const findCourse = async (ctx) => {
  const { course, courseRole } = ctx.state
  ctx.body = {
    ...only(course, 'id name description encrypt'),
    role: courseRole,
  }
}

/**
 * 创建课程
 */
const createCourse = async (ctx) => {
  const opt = ctx.request.body
  const course = new Course(only(opt, 'name description encrypt'))

  try {
    await course.save()
    ctx.body = only(course, 'id')
  } catch (err) {
    if (err.name === 'ValidationError') {
      return ctx.throw(400, err.message)
    }
    ctx.throw(500, 'Internal server error')
  }
}

module.exports = {
  preload,
  role,
  findCourses,
  findCourse,
  createCourse,
}
