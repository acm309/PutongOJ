import Router from '@koa/router'
import newsController from '../controllers/news'
import authnMiddleware from '../middlewares/authn'

const newsRouter = new Router({
  prefix: '/news',
})

newsRouter.get('/list',
  newsController.find,
)
newsRouter.get('/:nid',
  newsController.preload,
  newsController.findOne,
)
newsRouter.post('/',
  authnMiddleware.adminRequire,
  newsController.create,
)
newsRouter.put('/:nid',
  authnMiddleware.adminRequire,
  newsController.preload,
  newsController.update,
)
newsRouter.del('/:nid',
  authnMiddleware.rootRequire,
  newsController.del,
)

export default newsRouter
