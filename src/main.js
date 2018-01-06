// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import iView from 'iview'
import VueClipboard from 'vue-clipboard2'
import '@/my-theme/index.less'
import { formate, timePretty, timeContest } from '@/util/formate'

Vue.use(iView)
Vue.use(VueClipboard)
Vue.filter('formate', formate)
Vue.filter('timePretty', timePretty)
Vue.filter('timeContest', timeContest)

Vue.prototype.$Message.config({
  duration: 3.5 // 默认的 1.5s 也太短了
})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
