import Router from '@koa/router'
import userController from '../controllers/user'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const userRouter = new Router({
  prefix: '/users',
})

userRouter.get('/items',
  authnMiddleware.adminRequire,
  userController.getAllUserItems,
)
userRouter.get('/suggest',
  authnMiddleware.loginRequire,
  userController.suggestUsers,
)
userRouter.get('/ranklist',
  userController.findRanklist,
)
userRouter.get('/ranklist/export',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.dataExportLimit,
  userController.exportRanklist,
)
userRouter.get('/:uid',
  userController.getUser,
)

export default userRouter
