import type Router from '@koa/router'
import type { Context } from 'koa'
import { loadProfile, rootRequire } from '../../middlewares/authn.ts'
import { distributeWork } from '../../services/taskQueue.ts'
import { createEnvelopedResponse } from '../../utils/index.ts'

export async function triggerScanUploadsFolder (ctx: Context) {
  const task = 'scanUploadsFolder'
  const profile = await loadProfile(ctx)
  await distributeWork(task, '')
  ctx.auditLog.info(`Action <${task}> requested by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, null)
}

function registerAdminActionHandlers (router: Router) {
  router.post('/actions/scan-uploads-folder', rootRequire, triggerScanUploadsFolder)
}

export default registerAdminActionHandlers
