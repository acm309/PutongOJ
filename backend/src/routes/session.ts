import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import sessionController from '../controllers/session'

const sessionRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/session',
})

sessionRouter.post('/',
  sessionController.login,
)
sessionRouter.get('/',
  sessionController.profile,
)
sessionRouter.del('/',
  sessionController.logout,
)

export default sessionRouter
