import Router from '@koa/router'
import contestController from '../controllers/contest'
import authnMiddleware from '../middlewares/authn'

const contestRouter = new Router({
  prefix: '/contest',
})

contestRouter.get('/list',
  contestController.findContests,
)
contestRouter.get('/:cid',
  authnMiddleware.loginRequire,
  contestController.getContest,
)
contestRouter.get('/:cid/ranklist',
  authnMiddleware.loginRequire,
  contestController.getRanklist,
)
contestRouter.post('/',
  authnMiddleware.loginRequire,
  contestController.createContest,
)
contestRouter.put('/:cid',
  authnMiddleware.loginRequire,
  contestController.updateContest,
)
contestRouter.del('/:cid',
  authnMiddleware.rootRequire,
  contestController.removeContest,
)
contestRouter.post('/:cid/verify',
  authnMiddleware.loginRequire,
  contestController.verifyParticipant,
)

contestRouter.get('/:cid/solutions',
  authnMiddleware.loginRequire,
  contestController.managePermRequire,
  contestController.findSolutions,
)
contestRouter.get('/:cid/solutions/export',
  authnMiddleware.loginRequire,
  contestController.managePermRequire,
  contestController.exportSolutions,
)

export default contestRouter
