// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import {createApp} from 'vue'
import App from './App'
import router from './router'
// import VueClipboard from 'vue-clipboard2'
import ViewUIPlus from 'view-ui-plus'
import '@/my-theme/index.less'
import { semiRestful } from './api'
import { createPinia } from 'pinia'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'

// Vue.use(VueClipboard)

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(ViewUIPlus)

Promise.all([
  useSessionStore().fetch(),
  useRootStore().fetchWebsiteConfig()
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
