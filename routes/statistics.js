const Router = require('koa-router')
const statistics = require('../controllers/statistics')

const rotuer = new Router({
  prefix: '/statistics'
})

rotuer.get('/:pid', statistics.find)

module.exports = rotuer
