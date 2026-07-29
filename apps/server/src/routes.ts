import Router from '@koa/router'

import registerAccountHandlers from './handlers/account'
import registerAdminHandlers from './handlers/admin'
import registerContestHandlers from './handlers/contest'
import registerCourseHandlers from './handlers/course'
import registerDiscussionHandlers from './handlers/discussion'
import registerFileHandlers from './handlers/file'
import registerGroupHandlers from './handlers/group'
import registerOAuthHandlers from './handlers/oauth'
import registerPostHandlers from './handlers/post'
import registerProblemHandlers from './handlers/problem'
import registerSolutionHandlers from './handlers/solution'
import registerTagHandlers from './handlers/tag'
import registerTestcaseHandlers from './handlers/testcase'
import registerUserHandlers from './handlers/user'
import registerUtilsHandlers from './handlers/utils'

const router = new Router({ prefix: '/api' })

registerAccountHandlers(router)
registerAdminHandlers(router)
registerContestHandlers(router)
registerCourseHandlers(router)
registerDiscussionHandlers(router)
registerFileHandlers(router)
registerGroupHandlers(router)
registerPostHandlers(router)
registerOAuthHandlers(router)
registerProblemHandlers(router)
registerSolutionHandlers(router)
registerTestcaseHandlers(router)
registerTagHandlers(router)
registerUserHandlers(router)
registerUtilsHandlers(router)

export default router
