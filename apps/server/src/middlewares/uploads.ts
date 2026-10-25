import type { Context, Next } from 'koa'
import type { StoredFileInfo } from '../storage/types.ts'
import { Files } from '@putong-oj/db'
import { uploadStorage } from '../storage/index.ts'
import { assertUploadKey } from '../storage/types.ts'

function setFileHeaders (ctx: Context, file: StoredFileInfo) {
  ctx.status = 200
  const safeImage = /^image\/(?:png|jpeg|gif|webp|avif|bmp|tiff)$/.test(file.contentType)
  ctx.type = safeImage ? file.contentType : 'application/octet-stream'
  if (!safeImage) {
    ctx.set('Content-Disposition', 'attachment')
  }
  ctx.set('X-Content-Type-Options', 'nosniff')
  // Preserve koa-static's current 604800 ms cache setting, expressed in seconds.
  ctx.set('Cache-Control', 'max-age=604')
  ctx.length = file.sizeBytes
  if (file.etag) {
    ctx.set('ETag', file.etag)
  }
  if (file.lastModified) {
    ctx.lastModified = file.lastModified
  }
}

function clearFileHeaders (ctx: Context) {
  for (const header of [ 'Content-Length', 'Content-Disposition', 'ETag', 'Last-Modified' ]) {
    ctx.remove(header)
  }
  ctx.set('Cache-Control', 'no-store')
}

export async function serveUploads (ctx: Context, next: Next): Promise<void> {
  if (!ctx.path.startsWith('/uploads/')) {
    await next()
    return
  }
  // Handle missing uploads here, so neither static files nor SPA fallback can serve them.
  if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
    ctx.status = 405
    ctx.set('Allow', 'GET, HEAD')
    return
  }
  let key: string
  try {
    key = decodeURIComponent(ctx.path.slice('/uploads/'.length))
    assertUploadKey(key)
  } catch {
    ctx.status = 400
    return
  }
  try {
    const record = await Files.findOne({ storageKey: key }).select('deletedAt').lean()
    if (record?.deletedAt) {
      ctx.status = 404
      return
    }
    // Legacy files without a Files row remain reachable by their existing URL.
    const conditional = ctx.get('If-None-Match') || ctx.get('If-Modified-Since')
    if (ctx.method === 'HEAD' || conditional) {
      const info = await uploadStorage.head(key)
      if (!info) {
        ctx.status = 404
        return
      }
      setFileHeaders(ctx, info)
      if (ctx.fresh) {
        ctx.status = 304
        return
      }
      if (ctx.method === 'HEAD') {
        return
      }
    }
    const file = await uploadStorage.get(key)
    if (!file) {
      clearFileHeaders(ctx)
      ctx.status = 404
      return
    }
    setFileHeaders(ctx, file)
    ctx.body = file.body
  } catch (err) {
    ctx.auditLog.error(`Failed to read upload ${key}`, err)
    clearFileHeaders(ctx)
    ctx.status = 503
    ctx.type = 'text/plain'
    ctx.body = 'Upload storage unavailable'
  }
}
