import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import userController from '../controllers/user'
import { userRegisterRateLimit } from '../middlewares'
import authnMiddleware from '../middlewares/authn'

const userRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/user',
})

userRouter.get('/list',
  userController.find,
)
userRouter.get('/:uid',
  userController.findOne,
)
userRouter.post('/',
  userRegisterRateLimit,
  userController.userRegister,
)
userRouter.put('/:uid',
  authnMiddleware.loginRequire,
  userController.update,
)

export default userRouter
