import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import userController from '../controllers/user'
import { userCreateRateLimit } from '../middlewares'
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
  userCreateRateLimit,
  userController.create,
)
userRouter.put('/:uid',
  authnMiddleware.loginRequire,
  userController.update,
)

export default userRouter
