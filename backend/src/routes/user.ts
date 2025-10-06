import Router from '@koa/router'
import userController from '../controllers/user'

const userRouter = new Router({
  prefix: '/user',
})

userRouter.get('/list',
  userController.find,
)
userRouter.get('/:uid',
  userController.findOne,
)

export default userRouter
