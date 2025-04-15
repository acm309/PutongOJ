const only = require('only')
const { encrypt, coursePermission } = require('../config')
const Course = require('../models/Course')
const CoursePermission = require('../models/CoursePermission')
const { isAdmin, hasPermission } = require('../utils/helper')
// const User = require('../models/User')
// const logger = require('../utils/logger')

/**
 * 预加载课程信息
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

  const profile = ctx.state.profile
  let courseRole = coursePermission.None
  if (isAdmin(ctx.session.profile)) {
    courseRole = coursePermission.Entire
  } else {
    const userPermission = await CoursePermission.findOne({
      user: profile._id,
      course: course._id,
    }).lean().exec()
    if (userPermission) {
      courseRole = userPermission.role
    }
  }

  if (course.encrypt === encrypt.Private
    && !hasPermission(courseRole, coursePermission.Basic)
  ) {
    return ctx.throw(403, 'Permission denied')
  }

  ctx.state.course = course
  ctx.state.courseRole = courseRole
  await next()
}

/**
 * 查询课程列表
 */
const find = async (ctx) => {
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page) || 1
  const pageSize = Number.parseInt(opt.pageSize) || 10

  const list = await Course.paginate({}, {
    sort: { id: 1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id id name description encrypt',
  })
  ctx.body = list
}

/**
 * 查询课程信息
 */
const findOne = async (ctx) => {
  const course = ctx.state.course
  const courseRole = ctx.state.courseRole
  ctx.body = {
    ...only(course, 'id name description encrypt create'),
    role: courseRole,
  }
}

/**
 * 创建课程
 */
const create = async (ctx) => {
  const opt = ctx.request.body
  const course = new Course(only(opt, 'name description encrypt'))

  try {
    await course.save()
  } catch (err) {
    if (err.name === 'ValidationError') {
      return ctx.throw(400, err.message)
    }
    return ctx.throw(500, 'Internal server error')
  }

  ctx.body = only(course, 'id name description encrypt create')
}

module.exports = {
  preload,
  find,
  findOne,
  create,
}
