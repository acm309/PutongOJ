import Router from '@koa/router'
import tagController from '../controllers/tag'

const tagRouter = new Router({
  prefix: '/tags',
})

tagRouter.get('/',
  tagController.findTags,
)

export default tagRouter
