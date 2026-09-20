import type Router from '@koa/router'
import type { Context } from 'koa'
import {
  AdminFileListQueryResultSchema,
  AdminFileListQuerySchema,
  ErrorCode,
} from '@putong-oj/shared'
import { loadProfile } from '../../middlewares/authn.ts'
import fileService from '../../services/file.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function findFiles (ctx: Context) {
  const query = AdminFileListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const files = await fileService.findAdminFiles(query.data)
  if (!files) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Uploader not found')
  }

  const result = AdminFileListQueryResultSchema.encode(files)
  return createEnvelopedResponse(ctx, result)
}

export async function removeFile (ctx: Context) {
  const profile = await loadProfile(ctx)
  const storageKey = String(ctx.params.storageKey || '').trim()
  if (!storageKey) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid storage key')
  }

  const file = await fileService.removeFile(profile, storageKey)
  if (!file) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  ctx.auditLog.info(`<File:${file.storageKey}> deleted by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, null)
}

function registerAdminFileHandlers (router: Router) {
  router.get('/files', findFiles)
  router.delete('/files/:storageKey', removeFile)
}

export default registerAdminFileHandlers
