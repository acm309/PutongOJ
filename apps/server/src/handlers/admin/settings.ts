import type Router from '@koa/router'
import type { Context } from 'koa'
import { AvatarPresetsEditPayloadSchema } from '@putong-oj/shared'
import { loadProfile, rootRequire } from '../../middlewares/authn.ts'
import { settingsService } from '../../services/settings.ts'
import {
  createEnvelopedResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function updateAvatarPresets (ctx: Context) {
  const payload = AvatarPresetsEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  await settingsService.setAvatarPresets(payload.data.avatarPresets)
  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`<User:${profile.uid}> updated avatar presets`)
  return createEnvelopedResponse(ctx, payload.data.avatarPresets)
}

function registerAdminSettingsHandlers (router: Router) {
  router.put('/settings/avatar-presets', rootRequire, updateAvatarPresets)
}

export default registerAdminSettingsHandlers
