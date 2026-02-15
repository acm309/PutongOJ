import { createRouter, createWebHistory } from 'vue-router'
import { useLoadingBar } from '@/composables/useLoadingBar'
import { useSessionStore } from '@/store/modules/session'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const loadingBar = useLoadingBar()

// 全局身份确认
router.beforeEach((to, from, next) => {
  loadingBar.start()
  const session = useSessionStore()

  if (to.meta.requiresLogin && !session.isLogined) {
    session.toggleAuthnDialog()
    return next({ name: 'home' })
  }
  if (to.meta.requiresAdmin && !session.isAdmin) {
    return next({ name: 'home' })
  }

  next()
})

router.afterEach(() => {
  loadingBar.finish()
})

export default router
