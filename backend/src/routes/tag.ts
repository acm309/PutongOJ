import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import tagController from '../controllers/tag'
import authnMiddleware from '../middlewares/authn'

const tagRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/tag',
})

tagRouter.get('/list',
  tagController.findTags,
)
tagRouter.post('/',
  authnMiddleware.adminRequire,
  tagController.createTag,
)
tagRouter.get('/:tid',
  tagController.getTag,
)
tagRouter.put('/:tid',
  authnMiddleware.adminRequire,
  tagController.updateTag,
)
tagRouter.del('/:tid',
  authnMiddleware.adminRequire,
  tagController.removeTag,
)

export default module.exports = tagRouter
