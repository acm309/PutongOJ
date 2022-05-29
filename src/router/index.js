import routes from './routes'
import store from '../store'
import { sync } from 'vuex-router-sync'
import { LoadingBar } from 'iview'
import { useSessionStore } from '@/store/modules/session'
import { TRIGGER_LOGIN } from '../store/types'
import Router from 'vue-router'

const router = new Router({
  mode: 'history',
  routes
})

// 全局身份确认
router.beforeEach((to, from, next) => {
  LoadingBar.start()
  const session = useSessionStore()
  if (to.meta.requiresLogin) {
    const isLogined = session.isLogined
    if (isLogined) {
      next()
    } else {
      session[TRIGGER_LOGIN]()
      next({
        name: 'contestList'
      })
    }
  } else if (to.meta.requiresAdmin) {
    const isAdmin = session.isAdmin
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

router.afterEach(() => {
  LoadingBar.finish()
})

sync(store, router)

export default router
