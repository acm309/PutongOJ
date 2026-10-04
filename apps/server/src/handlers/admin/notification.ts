import type Router from '@koa/router'
import type { Context } from 'koa'
import {
  AdminNotificationCreatePayloadSchema,
  ErrorCode,
} from '@putong-oj/shared'
import { loadProfile } from '../../middlewares/authn.ts'
import notificationService from '../../services/notification.ts'
import userService from '../../services/user.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function sendNotificationBroadcast (ctx: Context) {
  const payload = AdminNotificationCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    await notificationService.sendBroadcastNotification(payload.data)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`A notification broadcast was sent by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to send notification broadcast', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function sendNotificationUser (ctx: Context) {
  const payload = AdminNotificationCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const username = String(ctx.params.username)
  const user = await userService.getUser(username)
  if (!username || !user) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  try {
    await notificationService.sendUserNotification(user.id, payload.data)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`A notification was sent to <User:${username}> by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to send notification to user', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function registerAdminNotificationHandlers (router: Router) {
  router.post('/notifications/broadcast', sendNotificationBroadcast)
  router.post('/notifications/users/:username', sendNotificationUser)
}

export default registerAdminNotificationHandlers
