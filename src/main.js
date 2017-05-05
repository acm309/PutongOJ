import Vue from 'vue'
import App from './App.vue'

import moment from 'moment'

import router from './router'
import store from './store'

Vue.filter('timePretty', function (time) {
  // parseInt 不能少，尽管有时 time 是一个看似数字的字符串
  // http://stackoverflow.com/questions/17371302/new-datemilliseconds-returns-invalid-date
  return moment(parseInt(time)).format('YYYY-MM-DD HH:mm:ss')
})

Vue.filter('judgePretty', function (judgeCode) {
  return store.getters.judges[judgeCode]
})

Vue.filter('languagePretty', function (languageCode) {
  return store.getters.languages[languageCode]
})

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
