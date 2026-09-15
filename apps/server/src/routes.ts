import Router from '@koa/router'

import registerAccountHandlers from './handlers/account.ts'
import registerAdminHandlers from './handlers/admin.ts'
import registerContestHandlers from './handlers/contest.ts'
import registerCourseHandlers from './handlers/course.ts'
import registerDiscussionHandlers from './handlers/discussion.ts'
import registerFileHandlers from './handlers/file.ts'
import registerGroupHandlers from './handlers/group.ts'
import registerOAuthHandlers from './handlers/oauth.ts'
import registerPostHandlers from './handlers/post.ts'
import registerProblemHandlers from './handlers/problem.ts'
import registerSolutionHandlers from './handlers/solution.ts'
import registerTagHandlers from './handlers/tag.ts'
import registerTestcaseHandlers from './handlers/testcase.ts'
import registerUserHandlers from './handlers/user.ts'
import registerUtilsHandlers from './handlers/utils.ts'

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
