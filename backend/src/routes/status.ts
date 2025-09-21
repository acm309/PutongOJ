import Router from '@koa/router'
import statusController from '../controllers/status'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const statusRouter = new Router({
  prefix: '/status',
})

statusRouter.get('/list',
  statusController.find,
)
statusRouter.get('/:sid',
  authnMiddleware.loginRequire,
  statusController.findOne,
)
statusRouter.put('/:sid',
  authnMiddleware.rootRequire,
  statusController.update,
)
statusRouter.post('/',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.solutionCreateLimit,
  statusController.create,
)

export default statusRouter
