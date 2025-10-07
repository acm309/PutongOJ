import Router from '@koa/router'
import userController from '../controllers/user'

const userRouter = new Router({
  prefix: '/user',
})

userRouter.get('/list',
  userController.find,
)
userRouter.get('/ranklist',
  userController.findRanklist,
)
userRouter.get('/:uid',
  userController.getUser,
)

export default userRouter
