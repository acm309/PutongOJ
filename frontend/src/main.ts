import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import locales from '@/locales'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { PutongAura } from '@/theme/aura'
import App from './App.vue'
import router from './router'
import '@/theme/index.less'
import 'primeicons/primeicons.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

app.use(PrimeVue, {
  theme: {
    preset: PutongAura,
    options: {
      prefix: 'p',
      darkModeSelector: '.ptoj-dark',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

const i18n = createI18n({
  allowComposition: true,
  globalInjection: true,
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: locales,
})

app.use(i18n)

Promise.all([
  useSessionStore().fetchProfile(),
  useRootStore().fetchWebsiteConfig(),
]).then(() => {
  // Router must be loaded after session/website config is loaded
  app.use(router)
  // https://www.mathew-paul.nz/posts/how-to-use-vue2-with-vite/
  app.mount('#app')
})

// Setup Volar for Vue3
// https://github.com/johnsoncodehk/volar/discussions/583
