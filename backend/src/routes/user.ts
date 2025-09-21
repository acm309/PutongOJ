import Router from '@koa/router'
import userController from '../controllers/user'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const userRouter = new Router({
  prefix: '/user',
})

userRouter.get('/list',
  userController.find,
)
userRouter.get('/:uid',
  userController.findOne,
)
userRouter.post('/',
  ratelimitMiddleware.userRegisterLimit,
  userController.userRegister,
)
userRouter.put('/:uid',
  authnMiddleware.loginRequire,
  userController.update,
)

export default userRouter
