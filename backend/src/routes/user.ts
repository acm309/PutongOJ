import Router from '@koa/router'
import userController from '../controllers/user'
import authnMiddleware from '../middlewares/authn'

const userRouter = new Router({
  prefix: '/user',
})

userRouter.get('/list',
  userController.find,
)
userRouter.get('/:uid',
  userController.findOne,
)
userRouter.put('/:uid',
  authnMiddleware.loginRequire,
  userController.update,
)

export default userRouter
