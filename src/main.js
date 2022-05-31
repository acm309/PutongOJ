import { createApp } from 'vue'
import ViewUIPlus from 'view-ui-plus'
import { createPinia } from 'pinia'
import App from './App'
import router from './router'
import '@/my-theme/index.less'
import { semiRestful } from './api'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(ViewUIPlus)

// https://forum.vuejs.org/t/how-to-use-globalproperties-in-vue-3-setup-method/108387/4
// https://vuejs.org/api/application.html#app-provide
app.provide('$Message', app.config.globalProperties.$Message)
app.provide('$Modal', app.config.globalProperties.$Modal)

Promise.all([
  useSessionStore().fetch(),
  useRootStore().fetchWebsiteConfig(),
]).then(() => {
  if (useRootStore().semi_restful) {
    semiRestful()
  }
  // Router must be loaded after session/website config is loaded
  app.use(router)
  // https://www.mathew-paul.nz/posts/how-to-use-vue2-with-vite/
  app.mount('#app')
})

// remove @vue/composition-api when migrated to Vue 3
// Setup Volar for Vue3
// https://github.com/johnsoncodehk/volar/discussions/583
