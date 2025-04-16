import { LoadingBar } from 'view-ui-plus'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useSessionStore } from '@/store/modules/session'

const router = createRouter({
  history: createWebHistory(),
  routes,
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
        name: 'home',
      })
    }
  } else if (to.meta.requiresAdmin) {
    const isAdmin = session.isAdmin
    if (isAdmin) {
      next()
    } else {
      next({
        name: 'home',
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
