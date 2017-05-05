import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from './views/Home.vue'
import Problems from './views/Problems.vue'
import Status from './views/Status.vue'
import Contests from './views/Contests.vue'
import Ranklist from './views/Ranklist.vue'
import FAQ from './views/FAQ.vue'

import News from './views/News.vue'
import Problem from './views/Problem.vue'
import User from './views/User.vue'
import Register from './views/Register.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Home,
    name: 'home',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit
    })
  }, {
    path: '/problems',
    component: Problems,
    name: 'problems',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit,
      field: route.query.field,
      query: route.query.query
    })
  }, {
    path: '/status',
    component: Status,
    name: 'status',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit,
      uid: route.query.uid,
      pid: route.query.pid,
      language: route.query.language,
      judge: route.query.judge
    })
  }, {
    path: '/ranklist',
    component: Ranklist,
    name: 'ranklist',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit
    })
  }, {
    path: '/contests',
    component: Contests,
    name: 'contests'
  }, {
    path: '/faq',
    component: FAQ,
    name: 'faq'
  }, {
    path: '/news/:nid',
    component: News,
    name: 'news',
    props: (route) => ({
      nid: route.params.nid
    })
  }, {
    path: '/problems/:pid',
    component: Problem,
    name: 'problem',
    props: (route) => ({
      pid: route.params.pid
    })
  }, {
    path: '/users/:uid',
    component: User,
    name: 'user',
    props: (route) => ({
      uid: route.params.uid
    })
  }, {
    path: '/register',
    component: Register,
    name: 'register'
  }
]

export default new VueRouter({
  mode: 'history',
  routes,
  linkExactActiveClass: 'is-active',
  linkActiveClass: 'is-active'
})
