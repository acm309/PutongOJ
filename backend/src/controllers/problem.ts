import type { Context } from 'koa'
import type { ObjectId } from 'mongoose'
import type { ProblemDocument } from '../models/Problem'
import type { CourseEntityViewWithRole, ProblemEntity, ProblemEntityView } from '../types/entity'
import { pick } from 'lodash'
import { loadProfile } from '../middlewares/authn'
import Solution from '../models/Solution'
import problemService from '../services/problem'
import { parsePaginateOption } from '../utils'
import constants from '../utils/constants'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/error'
import logger from '../utils/logger'
import { loadContest } from './contest'
import { loadCourse } from './course'

const { status, judge } = constants

export async function loadProblem (
  ctx: Context,
  inputId?: string | number,
): Promise<ProblemDocument> {
  const problemId = Number(
    inputId || ctx.params.pid || ctx.request.query.pid,
  )
  if (!Number.isInteger(problemId) || problemId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.problem?.pid === problemId) {
    return ctx.state.problem
  }

  const problem = await problemService.getProblem(problemId)
  if (!problem) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  if (!problem.course && problem.status === status.Available) {
    ctx.state.problem = problem
    return problem
  }

  const { profile } = ctx.state
  if (profile?.isAdmin) {
    ctx.state.problem = problem
    return problem
  }

  const contestId = Number(ctx.request.query.cid)
  if (Number.isInteger(contestId) && contestId > 0) {
    const contest = await loadContest(ctx, contestId)
    if (contest.list.includes(problemId)) {
      ctx.state.problem = problem
      return problem
    }
  }

  if (problem.course) {
    const { role } = await loadCourse(ctx, problem.course)
    if (
      (problem.status === status.Available && role.basic)
      || (problem.status === status.Reserve && role.manageProblem)
    ) {
      ctx.state.problem = problem
      return problem
    }
  }

  return ctx.throw(...ERR_PERM_DENIED)
}

export async function hasProblemPerm (
  ctx: Context,
  perm: 'manageProblem' | 'viewTestcase' = 'manageProblem',
): Promise<boolean> {
  const profile = ctx.state.profile
  if (!profile) {
    return false
  }
  if (profile.isAdmin) {
    return true
  }
  const problem = await loadProblem(ctx)
  if (!problem.course) {
    return false
  }
  const { role } = await loadCourse(ctx, problem.course)
  return role[perm] || false
}

const findProblems = async (ctx: Context) => {
  const opt = ctx.request.query
  const profile = ctx.state.profile
  let showAll: boolean = !!profile?.isAdmin

  /** @todo [ TO BE DEPRECATED ] 要有专门的 Endpoint 来获取所有题目 */
  if (Number(opt.page) === -1 && profile?.isAdmin) {
    const docs = await problemService.getAllProblems()
    ctx.body = { list: { docs, total: docs.length }, solved: [] }
    return
  }

  let courseDocId: ObjectId | undefined
  if (typeof opt.course === 'string') {
    const { course, role } = await loadCourse(ctx, opt.course)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    if (role.manageProblem) {
      showAll = true
    }
    courseDocId = course.id
  }
  const paginateOption = parsePaginateOption(opt, 30, 100)
  const type = typeof opt.type === 'string' ? opt.type : undefined
  const content = typeof opt.content === 'string' ? opt.content : undefined
  const list = await problemService.findProblems({
    ...paginateOption, type, content,
  }, showAll, courseDocId)

  let solved: number[] = []
  if (profile && list.total > 0) {
    solved = await Solution
      .find({
        uid: profile.uid,
        pid: { $in: list.docs.map(p => p.pid) },
        judge: judge.Accepted,
      })
      .distinct('pid')
      .lean()
  }

  ctx.body = { list, solved }
}

const getProblem = async (ctx: Context) => {
  const problem = await loadProblem(ctx)
  const canManage = await hasProblemPerm(ctx)

  let course: CourseEntityViewWithRole | null = null
  if (problem.course) {
    const { course: courseDoc, role } = await loadCourse(ctx, problem.course)
    course = {
      ...pick(courseDoc, [ 'courseId', 'name', 'description', 'encrypt' ]),
      role,
    }
  }
  const response: ProblemEntityView = {
    ...pick(problem, [ 'pid', 'title', 'time', 'memory', 'status', 'tags',
      'description', 'input', 'output', 'in', 'out', 'hint' ]),
    type: canManage ? problem.type : undefined,
    code: canManage ? problem.code : undefined,
    course,
  }
  ctx.body = response
}

const createProblem = async (ctx: Context) => {
  const opt = ctx.request.body
  const profile = await loadProfile(ctx)
  const hasPermission = async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (opt.course) {
      const { role } = await loadCourse(ctx, opt.course)
      return role.manageProblem
    }
    return false
  }
  if (!await hasPermission()) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  let courseDocId: ObjectId | undefined
  if (opt.course) {
    const { course } = await loadCourse(ctx, opt.course)
    courseDocId = course.id
  }

  try {
    const problem = await problemService.createProblem({
      ...pick(opt, [ 'title', 'time', 'memory', 'status', 'description',
        'input', 'output', 'in', 'out', 'hint', 'type', 'code' ]),
      course: courseDocId })
    logger.info(`Problem <${problem.pid}> is created by user <${profile.uid}>`)
    const response: Pick<ProblemEntity, 'pid'>
      = { pid: problem.pid }
    ctx.body = response
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return ctx.throw(400, err.message)
    } else {
      throw err
    }
  }
}

const updateProblem = async (ctx: Context) => {
  const opt = ctx.request.body
  const problem = await loadProblem(ctx)
  const profile = await loadProfile(ctx)
  if (!await hasProblemPerm(ctx)) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  let courseDocId: ObjectId | undefined | null
  if (opt.course && Number.isInteger(Number(opt.course))) {
    if (Number(opt.course) === -1) {
      courseDocId = null
    } else {
      const { course } = await loadCourse(ctx, opt.course)
      courseDocId = course.id
    }
  }

  const pid = problem.pid
  const uid = profile.uid
  try {
    const problem = await problemService.updateProblem(pid, {
      ...pick(opt, [ 'title', 'time', 'memory', 'status', 'description',
        'input', 'output', 'in', 'out', 'hint', 'type', 'code' ]),
      course: courseDocId })
    logger.info(`Problem <${pid}> is updated by user <${uid}>`)
    const response: Pick<ProblemEntity, 'pid'> & { success: boolean }
      = { pid: problem?.pid ?? -1, success: !!problem }
    ctx.body = response
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return ctx.throw(400, err.message)
    } else {
      throw err
    }
  }
}

const removeProblem = async (ctx: Context) => {
  const pid = ctx.params.pid
  const profile = await loadProfile(ctx)

  try {
    await problemService.removeProblem(Number(pid))
    logger.info(`Problem <${pid}> is deleted by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
  ctx.body = {}
}

const problemController = {
  loadProblem,
  hasProblemPerm,
  findProblems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
}

export default module.exports = problemController
