import Router from '@koa/router'
import { adminRequire } from '../../middlewares/authn.ts'
import registerAdminActionHandlers from './action.ts'
import registerAdminContestHandlers from './contest.ts'
import registerAdminDiscussionHandlers from './discussion.ts'
import registerAdminFileHandlers from './file.ts'
import registerAdminGroupHandlers from './group.ts'
import registerAdminNotificationHandlers from './notification.ts'
import registerAdminPostHandlers from './post.ts'
import registerAdminSettingsHandlers from './settings.ts'
import registerAdminSolutionHandlers from './solution.ts'
import registerAdminTagHandlers from './tag.ts'
import registerAdminUserHandlers from './user.ts'

function registerAdminHandlers (router: Router) {
  const adminRouter = new Router({ prefix: '/admin' })

  adminRouter.use(adminRequire)

  registerAdminUserHandlers(adminRouter)
  registerAdminSolutionHandlers(adminRouter)
  registerAdminContestHandlers(adminRouter)
  registerAdminPostHandlers(adminRouter)
  registerAdminNotificationHandlers(adminRouter)
  registerAdminGroupHandlers(adminRouter)
  registerAdminDiscussionHandlers(adminRouter)
  registerAdminSettingsHandlers(adminRouter)
  registerAdminActionHandlers(adminRouter)
  registerAdminFileHandlers(adminRouter)
  registerAdminTagHandlers(adminRouter)

  router.use(adminRouter.routes(), adminRouter.allowedMethods())
}

export default registerAdminHandlers
