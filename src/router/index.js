import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home'

// problems
import ProblemList from '@/views/problemList'
import Problem from '@/views/Problem/Problem'
import ProblemInfo from '@/views/Problem/ProblemInfo'
import ProblemSubmit from '@/views/Problem/Submit'
import ProblemStatistics from '@/views/Problem/Statistics'
import ProblemEdit from '@/views/Problem/problemEdit'

// status & solution
import Status from '@/views/Status'
import Solution from '@/views/Solution'

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
      children: [
        {
          path: '',
          name: 'problemInfo',
          component: ProblemInfo
        },
        {
          path: 'submit',
          name: 'problemSubmit',
          component: ProblemSubmit
        },
        {
          path: 'statistics',
          name: 'problemStatistics',
          component: ProblemStatistics
        },
        {
          path: 'edit',
          name: 'problemEdit',
          component: ProblemEdit
        }
      ]
    },
    {
      path: '/status',
      name: 'status',
      component: Status
    },
    {
      path: '/status/:sid',
      name: 'solution',
      component: Solution
    }
  ]
})
