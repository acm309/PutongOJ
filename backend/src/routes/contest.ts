import type { DefaultContext, DefaultState } from 'koa'
import Router from 'koa-router'
import contestController from '../controllers/contest'
import authnMiddleware from '../middlewares/authn'

const contestRouter = new Router<DefaultState, DefaultContext>({
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
  authnMiddleware.adminRequire,
  contestController.createContest,
)
contestRouter.put('/:cid',
  authnMiddleware.adminRequire,
  contestController.updateContest,
)
contestRouter.del('/:cid',
  authnMiddleware.adminRequire,
  contestController.deleteContest,
)
contestRouter.post('/:cid/verify',
  authnMiddleware.loginRequire,
  contestController.verifyParticipant,
)

export default module.exports = contestRouter
