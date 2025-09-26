import type { Context } from 'koa'
import type { ObjectId } from 'mongoose'
import type { CourseDocument } from '../models/Course'
import type { ProblemDocumentPopulated } from '../models/Problem'
import type { Paginated } from '../types'
import type { ProblemEntity, ProblemEntityItem, ProblemEntityPreview, ProblemEntityView, ProblemStatistics } from '../types/entity'
import { pick } from 'lodash'
import { loadProfile } from '../middlewares/authn'
import Solution from '../models/Solution'
import User from '../models/User'
import courseService from '../services/course'
import problemService from '../services/problem'
import tagService from '../services/tag'
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
): Promise<ProblemDocumentPopulated> {
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

  if (problem.status === status.Available) {
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

  if (problem.owner) {
    const owner = await User.findById(problem.owner).lean()
    if (owner && owner.uid === profile?.uid) {
      ctx.state.problem = problem
      return problem
    }
  }

  if (profile && await courseService.hasProblemRole(
    profile.id, problem.id, 'basic',
  )) {
    ctx.state.problem = problem
    return problem
  }

  return ctx.throw(...ERR_PERM_DENIED)
}

const findProblems = async (ctx: Context) => {
  const opt = ctx.request.query
  const profile = ctx.state.profile
  const showReserved: boolean = !!profile?.isAdmin

  /** @todo [ TO BE DEPRECATED ] 要有专门的 Endpoint 来获取所有题目 */
  if (Number(opt.page) === -1 && profile?.isAdmin) {
    const docs = await problemService.getProblemItems()
    ctx.body = { list: { docs, total: docs.length }, solved: [] }
    return
  }

  let courseDocId: ObjectId | undefined
  if (typeof opt.course === 'string') {
    const { course, role } = await loadCourse(ctx, opt.course)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    courseDocId = course._id
  }

  const paginateOption = parsePaginateOption(opt, 30, 100)
  const filterOption = {
    type: typeof opt.type === 'string' ? opt.type : undefined,
    content: typeof opt.content === 'string' ? opt.content : undefined,
  }

  let list: Paginated<ProblemEntityPreview & { owner?: ObjectId | null }>
  if (courseDocId) {
    list = await problemService.findCourseProblems(
      courseDocId,
      {
        ...paginateOption,
        ...filterOption,
      },
    )
  } else {
    list = await problemService.findProblems(
      {
        ...paginateOption,
        ...filterOption,
        showReserved,
        includeOwner: profile?.id ?? null,
      },
    )
  }
  list.docs = list.docs.map(doc => ({
    ...doc,
    isOwner: profile?.id && doc.owner
      ? doc.owner.toString() === profile.id.toString()
      : false,
    owner: undefined,
  }))

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

  ctx.body = { list, solved } as {
    list: Paginated<ProblemEntityPreview>
    solved: number[]
  }
}

const findProblemItems = async (ctx: Context) => {
  const opt = ctx.request.query

  let courseDocId: ObjectId | undefined
  if (typeof opt.course === 'string') {
    const { course, role } = await loadCourse(ctx, opt.course)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    courseDocId = course._id
  }

  const keyword = String(opt.keyword).trim()
  let response: ProblemEntityItem[] | undefined

  if (courseDocId) {
    response = await problemService.findCourseProblemItems(
      courseDocId, keyword,
    )
  } else {
    response = await problemService.findProblemItems(keyword)
  }

  ctx.body = response
}

const getProblem = async (ctx: Context) => {
  const problem = await loadProblem(ctx)
  const profile = ctx.state.profile

  const isOwner = (profile?.id && problem.owner)
    ? profile.id.toString() === problem.owner.toString()
    : false
  const canManage = profile?.isAdmin ?? isOwner

  const response: ProblemEntityView = {
    ...pick(problem, [ 'pid', 'title', 'time', 'memory', 'status',
      'description', 'input', 'output', 'in', 'out', 'hint' ]),
    type: canManage ? problem.type : undefined,
    code: canManage ? problem.code : undefined,
    tags: problem.tags.map(tagService.toItem),
    isOwner,
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

  const owner = profile.id as ObjectId
  let course: CourseDocument | undefined
  if (opt.course) {
    course = (await loadCourse(ctx, opt.course)).course
  }

  try {
    const problem = await problemService.createProblem({
      ...pick(opt, [ 'title', 'time', 'memory', 'status', 'description',
        'input', 'output', 'in', 'out', 'hint', 'type', 'code' ]),
      owner,
    })
    if (course) {
      await courseService.addCourseProblem(course.id, problem.id)
    }
    logger.info(`Problem <${problem.pid}> is created by user <${profile.uid}>`)
    const response: Pick<ProblemEntity, 'pid'>
      = pick(problem, [ 'pid' ])
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
  let canManage = profile?.isAdmin ?? false
  if (profile && !canManage && problem.owner) {
    const owner = await User.findById(problem.owner).lean()
    if (owner && owner.uid === profile.uid) {
      canManage = true
    }
  }
  if (!canManage) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const pid = problem.pid
  const uid = profile.uid
  try {
    const problem = await problemService.updateProblem(pid, {
      ...pick(opt, [ 'title', 'time', 'memory', 'status', 'description',
        'input', 'output', 'in', 'out', 'hint', 'type', 'code' ]),
      tags: Array.isArray(opt.tags)
        ? await tagService.getTagObjectIds(
            opt.tags.map((id: any) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0),
          )
        : undefined,
    })
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

const getStatistics = async (ctx: Context) => {
  const opt = ctx.request.query
  const problem = await loadProblem(ctx)
  const paginateOption = parsePaginateOption(opt, 30, 100)

  const result = await problemService.getStatistics(problem.pid, paginateOption)
  ctx.body = result as ProblemStatistics
}

const problemController = {
  loadProblem,
  findProblems,
  findProblemItems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
  getStatistics,
} as const

export default problemController
