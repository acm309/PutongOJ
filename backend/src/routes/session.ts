import Router from '@koa/router'
import sessionController from '../controllers/session'

const sessionRouter = new Router({
  prefix: '/session',
})

sessionRouter.post('/',
  sessionController.userLogin,
)
sessionRouter.get('/',
  sessionController.profile,
)
sessionRouter.del('/',
  sessionController.logout,
)

export default sessionRouter
