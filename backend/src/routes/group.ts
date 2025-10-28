import Router from '@koa/router'
import groupController from '../controllers/group'

const groupRouter = new Router({
  prefix: '/group',
})

groupRouter.get('/',
  groupController.findGroups,
)

export default groupRouter
