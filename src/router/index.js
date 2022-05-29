import routes from './routes'
import { LoadingBar } from 'iview'
import { useSessionStore } from '@/store/modules/session'
import Router from 'vue-router'

const router = new Router({
  mode: 'history',
  routes
})

// 全局身份确认
// To In-component Guard?
// https://stackoverflow.com/questions/63495876/vue-router-navigation-guard-dynamic-import
router.beforeEach((to, from, next) => {
  LoadingBar.start()
  const session = useSessionStore()
  if (to.meta.requiresLogin) {
    const isLogined = session.isLogined
    if (isLogined) {
      next()
    } else {
      session.toggleLoginState()
      next({
        name: 'contestList'
      })
    }
  } else if (to.meta.requiresAdmin) {
    const isAdmin = session.isAdmin
    console.log('isAdmin', isAdmin)
  // TODO: session is used before being fetched
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

export default router
