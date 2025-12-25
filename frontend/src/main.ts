import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { Message, Modal, Spin } from 'view-ui-plus'
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

// https://forum.vuejs.org/t/how-to-use-globalproperties-in-vue-3-setup-method/108387/4
// https://vuejs.org/api/application.html#app-provide
app.config.globalProperties.$Message = Message
app.config.globalProperties.$Modal = Modal
app.config.globalProperties.$Spin = Spin

app.provide('$Message', app.config.globalProperties.$Message)
app.provide('$Modal', app.config.globalProperties.$Modal)
app.provide('$Spin', app.config.globalProperties.$Spin)

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
