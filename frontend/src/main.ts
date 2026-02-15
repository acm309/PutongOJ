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
import App from './App.vue'
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

const app = createApp(App)
const pinia = createPinia()
const i18n = createI18n(i18nOptions)

app.use(pinia)
app.use(i18n)
app.use(PrimeVue, primeVueOptions)
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

Promise.all([
  useSessionStore().fetchProfile(),
  useRootStore().fetchWebsiteConfig(),
  useThemeStore(), // Initialize theme store to apply theme
]).then(() => {
  // Router must be loaded after session/website config is loaded
  app.use(router)
  // https://www.mathew-paul.nz/posts/how-to-use-vue2-with-vite/
  app.mount('#app')
})
