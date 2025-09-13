import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import testcaseController from '../controllers/testcase'
import authnMiddleware from '../middlewares/authn'

const testcaseRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/testcase',
})

testcaseRouter.get('/:pid',
  authnMiddleware.loginRequire,
  testcaseController.findTestcases,
)
testcaseRouter.post('/:pid',
  authnMiddleware.loginRequire,
  testcaseController.createTestcase,
)
testcaseRouter.get('/:pid/:uuid',
  authnMiddleware.loginRequire,
  testcaseController.fetchTestcase,
)
testcaseRouter.del('/:pid/:uuid',
  authnMiddleware.loginRequire,
  testcaseController.removeTestcase,
)

export default testcaseRouter
