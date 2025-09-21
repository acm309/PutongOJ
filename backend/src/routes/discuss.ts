import Router from '@koa/router'
import discussController from '../controllers/discuss'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

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
  ratelimitMiddleware.commentCreateLimit,
  discussController.create,
)
discussRouter.put('/:did',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.commentCreateLimit,
  discussController.preload,
  discussController.update,
)
discussRouter.del('/:did',
  authnMiddleware.adminRequire,
  discussController.del,
)

export default discussRouter
