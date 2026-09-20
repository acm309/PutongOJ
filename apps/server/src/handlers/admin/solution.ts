import type Router from '@koa/router'
import type { Context } from 'koa'
import {
  AdminSolutionListExportQueryResultSchema,
  AdminSolutionListExportQuerySchema,
  AdminSolutionListQueryResultSchema,
  AdminSolutionListQuerySchema,
} from '@putong-oj/shared'
import { dataExportLimit } from '../../middlewares/ratelimit.ts'
import solutionService from '../../services/solution.ts'
import {
  createEnvelopedResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function findSolutions (ctx: Context) {
  const query = AdminSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const solutions = await solutionService.findSolutions(query.data)
  const result = AdminSolutionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function exportSolutions (ctx: Context) {
  const query = AdminSolutionListExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const solutions = await solutionService.exportSolutions(query.data)
  const result = AdminSolutionListExportQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

function registerAdminSolutionHandlers (router: Router) {
  router.get('/solutions', findSolutions)
  router.get('/solutions/export', dataExportLimit, exportSolutions)
}

export default registerAdminSolutionHandlers
