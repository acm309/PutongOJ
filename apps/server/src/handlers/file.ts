import type { Context } from 'koa'
import Router from '@koa/router'
import { ErrorCode, FileListQueryResultSchema, FileListQuerySchema, FileUploadResultSchema } from '@putongoj/shared'
import { loadProfile, loginRequire } from '../middlewares/authn'
import fileService from '../services/file'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils'

export async function upload (ctx: Context) {
  const profile = await loadProfile(ctx)
  if (!ctx.request.files || !ctx.request.files.image) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'No file uploaded')
  }
  const file = ctx.request.files.image
  if (Array.isArray(file)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid file uploaded')
  }
  if (!file) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'No file uploaded')
  }

  const uploaded = await fileService.uploadFile(profile, file)
  if (!uploaded.success) {
    return createErrorResponse(
      ctx,
      ErrorCode.Forbidden,
      `Storage quota exceeded. used=${uploaded.quota.usedBytes}, quota=${uploaded.quota.storageQuota}, incoming=${uploaded.sizeBytes}`,
    )
  }

  const result = FileUploadResultSchema.encode({
    storageKey: uploaded.record.storageKey,
    url: uploaded.url,
    sizeBytes: uploaded.sizeBytes,
  })
  ctx.auditLog.info(`<File:${uploaded.record.storageKey}> uploaded by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, result)
}

export async function findFiles (ctx: Context) {
  const query = FileListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const profile = await loadProfile(ctx)
  const result = await fileService.findFiles(profile, query.data)
  const encoded = FileListQueryResultSchema.encode(result)
  return createEnvelopedResponse(ctx, encoded)
}

export async function removeFile (ctx: Context) {
  const profile = await loadProfile(ctx)
  const storageKey = String(ctx.params.storageKey || '').trim()
  if (!storageKey) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid storage key')
  }

  const file = await fileService.removeFile(profile, storageKey)
  if (file === false) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Insufficient privilege to delete this file')
  }
  if (!file) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'File not found')
  }

  ctx.auditLog.info(`<File:${file.storageKey}> deleted by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, null)
}

function registerFileHandlers (router: Router) {
  router.post('/upload', loginRequire, upload)

  const fileRouter = new Router({ prefix: '/files' })

  fileRouter.get('/', loginRequire, findFiles)
  fileRouter.delete('/:storageKey', loginRequire, removeFile)

  router.use(fileRouter.routes(), fileRouter.allowedMethods())
}

export default registerFileHandlers
