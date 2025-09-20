import Router from '@koa/router'
import discussController from '../controllers/discuss'
import { commentCreateRateLimit } from '../middlewares'
import authnMiddleware from '../middlewares/authn'

const discussRouter = new Router({
  prefix: '/discuss',
})

discussRouter.get('/list',
  authnMiddleware.loginRequire,
  discussController.find,
)
discussRouter.get('/:did',
  authnMiddleware.loginRequire,
  discussController.preload,
  discussController.findOne,
)
discussRouter.post('/',
  authnMiddleware.loginRequire,
  commentCreateRateLimit,
  discussController.create,
)
discussRouter.put('/:did',
  authnMiddleware.loginRequire,
  commentCreateRateLimit,
  discussController.preload,
  discussController.update,
)
discussRouter.del('/:did',
  authnMiddleware.adminRequire,
  discussController.del,
)

export default discussRouter
