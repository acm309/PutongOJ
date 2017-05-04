import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from './views/Home.vue'
import Problems from './views/Problems.vue'
import Status from './views/Status.vue'
import Contests from './views/Contests.vue'
import Ranklist from './views/Ranklist.vue'
import FAQ from './views/FAQ.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Home,
    name: 'home'
  }, {
    path: '/problems',
    component: Problems,
    name: 'problems',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit
    })
  }, {
    path: '/status',
    component: Status,
    name: 'status'
  }, {
    path: '/ranklist',
    component: Ranklist,
    name: 'ranklist'
  }, {
    path: '/contests',
    component: Contests,
    name: 'contests'
  }, {
    path: '/faq',
    component: FAQ,
    name: 'faq'
  }
]

export default new VueRouter({
  mode: 'history',
  routes,
  linkExactActiveClass: 'is-active',
  linkActiveClass: 'is-active'
})
