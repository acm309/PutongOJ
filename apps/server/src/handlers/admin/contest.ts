import type Router from '@koa/router'
import type { ContestModel } from '@putong-oj/shared'
import type { Context } from 'koa'
import type { QueryFilter } from '../../types/mongo.ts'
import {
  AdminContestListQueryResultSchema,
  AdminContestListQuerySchema,
} from '@putong-oj/shared'
import escapeRegExp from 'lodash/escapeRegExp.js'
import { contestService } from '../../services/contest.ts'
import courseService from '../../services/course.ts'
import {
  createEnvelopedResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function findContests (ctx: Context) {
  const query = AdminContestListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { page, pageSize, sort, sortBy, contestId, title, course, isHidden, isPublic, isLocked } = query.data
  const filters: QueryFilter<ContestModel> = {}
  if (contestId !== undefined) {
    filters.contestId = contestId
  }
  if (title) {
    filters.title = { $regex: new RegExp(escapeRegExp(title), 'i') }
  }
  if (course === -1) {
    filters.$or = [ { course: { $exists: false } }, { course: null } ]
  } else if (course !== undefined) {
    const courseDoc = await courseService.getCourse(course)
    if (!courseDoc) {
      const result = AdminContestListQueryResultSchema.encode({
        docs: [], limit: pageSize, page, pages: 0, total: 0,
      })
      return createEnvelopedResponse(ctx, result)
    }
    filters.course = courseDoc._id
  }
  if (isHidden !== undefined) {
    filters.isHidden = isHidden
  }
  if (isPublic !== undefined) {
    filters.isPublic = isPublic
  }
  if (isLocked !== undefined) {
    filters.isLocked = isLocked
  }

  const contests = await contestService.findContests(
    { page, pageSize, sort, sortBy },
    filters,
  )
  const result = AdminContestListQueryResultSchema.encode(contests)
  return createEnvelopedResponse(ctx, result)
}

function registerAdminContestHandlers (router: Router) {
  router.get('/contests', findContests)
}

export default registerAdminContestHandlers
