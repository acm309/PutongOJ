import Router from '@koa/router'
import statusController from '../controllers/status'
import { solutionCreateRateLimit } from '../middlewares'
import authnMiddleware from '../middlewares/authn'

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
  solutionCreateRateLimit,
  statusController.create,
)

export default statusRouter
