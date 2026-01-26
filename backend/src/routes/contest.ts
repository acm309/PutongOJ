import Router from '@koa/router'
import contestController from '../controllers/contest'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const contestRouter = new Router({
  prefix: '/contests',
})

contestRouter.get('/',
  contestController.findContests,
)
contestRouter.get('/:contestId',
  authnMiddleware.loginRequire,
  contestController.getContest,
)
contestRouter.get('/:contestId/participation',
  authnMiddleware.loginRequire,
  contestController.getParticipation,
)
contestRouter.post('/:contestId/participation',
  authnMiddleware.loginRequire,
  contestController.participateContest,
)
contestRouter.get('/:contestId/ranklist',
  authnMiddleware.loginRequire,
  contestController.getRanklist,
)
contestRouter.post('/',
  authnMiddleware.loginRequire,
  contestController.createContest,
)
contestRouter.get('/:contestId/configs',
  authnMiddleware.loginRequire,
  contestController.getConfig,
)
contestRouter.put('/:contestId/configs',
  authnMiddleware.loginRequire,
  contestController.updateConfig,
)
// contestRouter.del('/:contestId',
//   authnMiddleware.rootRequire,
//   contestController.removeContest,
// )

contestRouter.get('/:contestId/solutions',
  authnMiddleware.loginRequire,
  contestController.findSolutions,
)
contestRouter.get('/:contestId/solutions/export',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.dataExportLimit,
  contestController.exportSolutions,
)

contestRouter.get('/:contestId/discussions',
  authnMiddleware.loginRequire,
  contestController.findContestDiscussions,
)

export default contestRouter
