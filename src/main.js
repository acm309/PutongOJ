import Vue from 'vue'
import App from './App.vue'

import moment from 'moment'
import leftPad from 'left-pad'

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

Vue.filter('durationPretty', function (time) {
  const duration = moment.duration(parseInt(time))
  const m = duration.minutes()
  const s = duration.seconds()
  return `${Math.floor(duration.asHours())}:${leftPad(m, 2, '0')}:${leftPad(s, 2, '0')}`
})

Vue.filter('encryptPretty', function (code) {
  const value = +code
  for (let key in store.getters.encrypt) {
    if (store.getters.encrypt[key] === code) {
      return key
    }
  }
  return `Unknown`
})

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
