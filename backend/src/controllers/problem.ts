import type { Paginated } from '@putongoj/shared'
import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { DiscussionQueryFilters } from '../services/discussion'
import type { WithId } from '../types'
import type { CourseEntity, ProblemEntity, ProblemEntityItem, ProblemEntityPreview, ProblemEntityView } from '../types/entity'
import {
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  ProblemSolutionListQueryResultSchema,
  ProblemSolutionListQuerySchema,
  ProblemStatisticsQueryResultSchema,
} from '@putongoj/shared'
import { pick } from 'lodash'
import { loadProfile } from '../middlewares/authn'
import Solution from '../models/Solution'
import User from '../models/User'
import { loadCourseStateOrThrow } from '../policies/course'
import { publicDiscussionTypes } from '../policies/discussion'
import { loadProblemOrThrow } from '../policies/problem'
import courseService from '../services/course'
import discussionService from '../services/discussion'
import problemService from '../services/problem'
import solutionService from '../services/solution'
import tagService from '../services/tag'
import { getUser } from '../services/user'
import { createEnvelopedResponse, createZodErrorResponse, parsePaginateOption } from '../utils'
import constants, { ERR_PERM_DENIED } from '../utils/constants'

const { judge } = constants

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

  let courseDocId: Types.ObjectId | undefined
  if (typeof opt.course === 'string') {
    const { course, role } = await loadCourseStateOrThrow(ctx, opt.course)
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

  let list: Paginated<ProblemEntityPreview & { owner?: Types.ObjectId | null }>
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
        includeOwner: profile?._id ?? null,
      },
    )
  }
  list.docs = list.docs.map(doc => ({
    ...doc,
    isOwner: profile?._id && doc.owner
      ? doc.owner.equals(profile._id)
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
  const profile = await loadProfile(ctx)

  let courseDocId: Types.ObjectId | undefined
  if (typeof opt.course === 'string') {
    const { course, role } = await loadCourseStateOrThrow(ctx, opt.course)
    if (!role.manageContest) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    courseDocId = course._id
  }

  if (!courseDocId && !profile.isAdmin) {
    return ctx.throw(...ERR_PERM_DENIED)
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
  const problem = await loadProblemOrThrow(ctx)
  const profile = ctx.state.profile

  const isOwner = (profile?._id && problem.owner)
    ? problem.owner.equals(profile._id)
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
      const { role } = await loadCourseStateOrThrow(ctx, opt.course)
      return role.manageProblem
    }
    return false
  }
  if (!await hasPermission()) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const owner = profile._id
  let course: WithId<CourseEntity> | undefined
  if (opt.course) {
    course = (await loadCourseStateOrThrow(ctx, opt.course)).course
  }

  try {
    const problem = await problemService.createProblem({
      ...pick(opt, [ 'title', 'time', 'memory', 'status', 'description',
        'input', 'output', 'in', 'out', 'hint', 'type', 'code' ]),
      owner,
    })
    if (course) {
      await courseService.addCourseProblem(course._id, problem._id)
    }
    ctx.auditLog.info(`<Problem:${problem.pid}> created by <User:${profile.uid}>`)
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
  const problem = await loadProblemOrThrow(ctx)
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
    ctx.auditLog.info(`<Problem:${pid}> updated by <User:${uid}>`)
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
    ctx.auditLog.info(`<Problem:${pid}> removed by <User:${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
  ctx.body = {}
}

const getStatistics = async (ctx: Context) => {
  const problem = await loadProblemOrThrow(ctx)
  const statistics = await problemService.getStatistics(problem._id)
  const result = ProblemStatisticsQueryResultSchema.encode(statistics)
  return createEnvelopedResponse(ctx, result)
}

export async function findSolutions (ctx: Context) {
  const query = ProblemSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const problem = await loadProblemOrThrow(ctx)
  const solutions = await solutionService.findSolutions({
    ...query.data,
    problem: problem.pid,
  })
  const result = ProblemSolutionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function findProblemDiscussions (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { profile } = ctx.state
  const { page, pageSize, sort, sortBy, type, author } = query.data

  const queryFilter: DiscussionQueryFilters = {}
  if (type) {
    queryFilter.type = type
  }
  if (author) {
    const authorUser = await getUser(author)
    if (authorUser) {
      queryFilter.author = authorUser._id
    }
  }

  const filters: DiscussionQueryFilters[] = [
    { problem: problem._id, contest: null }, queryFilter,
  ]
  if (!(profile?.isAdmin)) {
    const visibilityFilters: DiscussionQueryFilters[] = [ {
      type: { $in: publicDiscussionTypes },
    } ]
    if (profile) {
      visibilityFilters.push({ author: profile._id })
    }
    filters.push({ $or: visibilityFilters })
  }

  const discussions = await discussionService.findDiscussions(
    { page, pageSize, sort, sortBy },
    { $and: filters },
    [ 'discussionId', 'author', 'type', 'pinned', 'title', 'createdAt', 'lastCommentAt', 'comments' ],
    { author: [ 'uid', 'avatar' ] },
  )
  const result = DiscussionListQueryResultSchema.encode({
    ...discussions,
    docs: discussions.docs.map(discussion => ({
      ...discussion, contest: null, problem: { pid: problem.pid },
    })),
  })
  return createEnvelopedResponse(ctx, result)
}

const problemController = {
  findProblems,
  findProblemItems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
  getStatistics,
  findSolutions,
  findProblemDiscussions,
} as const

export default problemController
