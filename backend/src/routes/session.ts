import Router from '@koa/router'
import sessionController from '../controllers/session'
import ratelimitMiddleware from '../middlewares/ratelimit'

const sessionRouter = new Router({
  prefix: '/session',
})

sessionRouter.post('/',
  ratelimitMiddleware.userLoginLimit,
  sessionController.userLogin,
)
sessionRouter.get('/',
  sessionController.profile,
)
sessionRouter.del('/',
  sessionController.logout,
)

export default sessionRouter
