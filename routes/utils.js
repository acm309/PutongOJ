const utils = require('../controllers/utils')
const Router = require('koa-router')

const router = new Router()

router.post('/submit', utils.submit)

module.exports = router
