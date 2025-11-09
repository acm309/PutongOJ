import Router from '@koa/router'
import discussionController from '../controllers/discussion'
import authnMiddleware from '../middlewares/authn'
import ratelimitMiddleware from '../middlewares/ratelimit'

const discussionRouter = new Router({
  prefix: '/discussions',
})

discussionRouter.get('/',
  discussionController.findDiscussions,
)
discussionRouter.post('/',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.discussionCreateLimit,
  discussionController.createDiscussion,
)

discussionRouter.get('/:discussionId',
  discussionController.getDiscussion,
)
discussionRouter.post('/:discussionId/comments',
  authnMiddleware.loginRequire,
  ratelimitMiddleware.commentCreateLimit,
  discussionController.createComment,
)

export default discussionRouter
