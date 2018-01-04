import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home'
import ProblemList from '@/views/problemList'
import Problem from '@/views/Problem/Problem'
import ProblemInfo from '@/views/Problem/ProblemInfo'
import ProblemSubmit from '@/views/Problem/Submit'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/problems',
      name: 'problemList',
      component: ProblemList
    },
    {
      path: '/problem/:pid',
      component: Problem,
      children: [{
        path: '',
        name: 'problemInfo',
        component: ProblemInfo
      }, {
        path: 'submit',
        name: 'problemSubmit',
        component: ProblemSubmit
      }]
    }
  ]
})
