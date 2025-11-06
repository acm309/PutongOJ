import Router from '@koa/router'
import discussionController from '../controllers/discussion'
import authnMiddleware from '../middlewares/authn'

const discussionRouter = new Router({
  prefix: '/discussions',
})

discussionRouter.get('/',
  authnMiddleware.rootRequire,
  discussionController.findDiscussions,
)

discussionRouter.get('/:discussionId',
  authnMiddleware.rootRequire,
  discussionController.getDiscussion,
)

export default discussionRouter
