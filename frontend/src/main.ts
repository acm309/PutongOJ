import type { App } from 'vue'
import { VueUmamiPlugin } from '@jaseeey/vue-umami-plugin'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import locales from '@/locales'
import router from '@/router'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useThemeStore } from '@/store/theme'
import { PutongAura } from '@/styles/aura'
import rootComponent from './App.vue'
import 'primeicons/primeicons.css'

const primeVueOptions = {
  theme: {
    preset: PutongAura,
    options: {
      prefix: 'p',
      darkModeSelector: '.ptoj-dark',
    },
  },
}
const i18nOptions = {
  allowComposition: true,
  globalInjection: true,
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: locales,
}

function setupUmami (app: App) {
  const { umamiAnalytics } = useRootStore().config
  if (!umamiAnalytics?.websiteId) {
    return
  }

  app.use(
    VueUmamiPlugin({
      websiteID: umamiAnalytics.websiteId,
      scriptSrc: umamiAnalytics.scriptURL,
      router,
    }),
  )
}

async function bootstrap () {
  const app = createApp(rootComponent)
  const i18n = createI18n(i18nOptions)
  const pinia = createPinia()

  app.use(pinia)
  app.use(i18n)
  app.use(PrimeVue, primeVueOptions)
  app.use(ToastService)
  app.use(ConfirmationService)
  app.directive('tooltip', Tooltip)

  // Initialize theme store early so
  // the effective theme class is applied before mount.
  useThemeStore()

  await Promise.all([
    useSessionStore().fetchProfile(),
    useRootStore().fetchPublicConfig(),
  ])

  // Router and Umami must be loaded after
  // session and config are loaded.
  setupUmami(app)
  app.use(router)
  app.mount('#app')
}

bootstrap()
