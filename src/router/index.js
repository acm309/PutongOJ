import routes from './routes'
import { LoadingBar } from 'view-ui-plus'
import { useSessionStore } from '@/store/modules/session'
import {createWebHashHistory, createRouter} from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
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
      session.toggleLoginState()
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

export default router
