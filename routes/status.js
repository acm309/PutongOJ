const Router = require('koa-router')
const status = require('../controllers/status')

const router = new Router({
  prefix: '/status'
})

router.get('/', status.queryList)
router.get('/:sid', status.queryOneSolution)
router.post('/:sid', status.create)
router.put('/:sid', status.rejudge)

module.exports = router
