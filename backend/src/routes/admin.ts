import Router from '@koa/router'
import adminController from '../controllers/admin'
import authnMiddleware from '../middlewares/authn'

const adminRouter = new Router({
  prefix: '/admin',
})

adminRouter.get('/user',
  authnMiddleware.loginRequire,
  adminController.findUsers,
)

export default adminRouter
