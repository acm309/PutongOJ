import Vue from 'vue'
import App from './App.vue'

import moment from 'moment'

import router from './router'
import store from './store'

Vue.filter('timePretty', function (time) {
  return moment().format('YYYY-MM-DD HH:mm:ss')
})

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
