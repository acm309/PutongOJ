import Router from '@koa/router'
import ranklistController from '../controllers/ranklist'

const ranklistRouter = new Router({
  prefix: '/ranklist',
})

ranklistRouter.get('/list',
  ranklistController.find,
)

export default ranklistRouter
