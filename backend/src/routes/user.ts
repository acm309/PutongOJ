import Router from '@koa/router'
import userController from '../controllers/user'
import authnMiddleware from '../middlewares/authn'

const userRouter = new Router({
  prefix: '/user',
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
userRouter.get('/:uid',
  userController.getUser,
)

export default userRouter
