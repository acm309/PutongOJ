import type { Context, Next } from 'koa'
import type { StoredFile } from '../storage/types.ts'
import { Files } from '@putong-oj/db'
import { uploadStorage } from '../storage/index.ts'
import { assertUploadKey } from '../storage/types.ts'

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
  const record = await Files.findOne({ storageKey: key }).select('deletedAt').lean()
  if (record?.deletedAt) {
    ctx.status = 404
    return
  }
  // Legacy files without a Files row remain reachable by their existing URL.
  const file = ctx.method === 'HEAD' ? await uploadStorage.head(key) : await uploadStorage.get(key)
  if (!file) {
    ctx.status = 404
    return
  }
  const body = ctx.method === 'GET' ? (file as StoredFile).body : undefined
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
  if (ctx.fresh) {
    body?.destroy()
    ctx.status = 304
    return
  }
  if (body) {
    ctx.body = body
  }
}
