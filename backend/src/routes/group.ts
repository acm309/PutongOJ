import Router from '@koa/router'
import groupController from '../controllers/group'
import authnMiddleware from '../middlewares/authn'

const groupRouter = new Router({
  prefix: '/group',
})

groupRouter.get('/',
  groupController.findGroups,
)
groupRouter.get('/list',
  groupController.find,
)
groupRouter.get('/:gid',
  groupController.preload,
  groupController.findOne,
)
groupRouter.post('/',
  authnMiddleware.adminRequire,
  groupController.create,
)
groupRouter.put('/:gid',
  authnMiddleware.adminRequire,
  groupController.preload,
  groupController.update,
)
groupRouter.del('/:gid',
  authnMiddleware.adminRequire,
  groupController.preload,
  groupController.del,
)

export default groupRouter
