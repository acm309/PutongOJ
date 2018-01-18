import Vue from 'vue'
import Router from 'vue-router'
import routes from './routes'
import store from '../store'

Vue.use(Router)

const router = new Router({
  // mode: 'history',
  routes
})

// 全局身份确认
router.beforeEach((to, from, next) => {
  if (to.meta.requiresLogin) {
    const isLogined = store.getters['session/isLogined']
    if (isLogined) {
      next()
    } else {
      store.commit('session/TRIGGER_LOGIN')
      next({
        name: 'contestList'
      })
    }
  } else if (to.meta.requiresAdmin) {
    const isAdmin = store.getters['session/isAdmin']
    if (isAdmin) {
      next()
    } else {
      next({
        name: 'home'
      })
    }
  } else {
    next()
  }
})

export default router
