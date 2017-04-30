const Router = require('koa-router')
const home = require('../controllers/home')

const router = new Router({
  prefix: ''
})

router.get('/servertime', home.servertime)

module.exports = router
