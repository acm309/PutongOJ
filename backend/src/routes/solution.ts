import Router from '@koa/router'
import solutionController from '../controllers/solution'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const solutionRouter = new Router({
  prefix: '/status',
})

solutionRouter.get('/:sid',
  authnMiddleware.loginRequire,
  solutionController.findOne,
)
solutionRouter.put('/:sid',
  authnMiddleware.rootRequire,
  solutionController.updateSolution,
)
solutionRouter.post('/',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.solutionCreateLimit,
  solutionController.create,
)

export default solutionRouter
