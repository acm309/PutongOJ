import type { DefaultContext, DefaultState } from 'koa'
import Router from '@koa/router'
import tagController from '../controllers/tag'
import authnMiddleware from '../middlewares/authn'

const tagRouter = new Router<DefaultState, DefaultContext>({
  prefix: '/tag',
})

tagRouter.get('/',
  tagController.findTags,
)
tagRouter.get('/items',
  tagController.findTagItems,
)
tagRouter.post('/',
  authnMiddleware.adminRequire,
  tagController.createTag,
)
tagRouter.get('/:tagId',
  authnMiddleware.adminRequire,
  tagController.getTag,
)
tagRouter.put('/:tagId',
  authnMiddleware.adminRequire,
  tagController.updateTag,
)
tagRouter.delete('/:tagId',
  authnMiddleware.adminRequire,
  tagController.removeTag,
)

export default module.exports = tagRouter
