const status = require('../controllers/status')
const Router = require('koa-router')

const router = new Router({
  prefix: '/status'
})

router.get('/list', status.list)
router.get('/:sid', status.findOne)
router.post('/', status.create)

module.exports = router
