import { createRouter, createWebHistory } from 'vue-router'
import { useLoadingBar } from '@/composables/loadingBar'
import { useSessionStore } from '@/store/modules/session'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const loadingBar = useLoadingBar()

// Global navigation guard
router.beforeEach((to, _from) => {
  loadingBar.start()
  const session = useSessionStore()

  if (to.meta.requiresLogin && !session.isLogined) {
    session.toggleAuthnDialog()
    return { name: 'home' }
  }
  if (to.meta.requiresAdmin && !session.isAdmin) {
    return { name: 'home' }
  }

  return true
})

router.afterEach(() => {
  loadingBar.finish()
})

export default router
