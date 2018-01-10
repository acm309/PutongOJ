import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home'

// problems
import ProblemList from '@/views/ProblemList'
import Problem from '@/views/Problem/Problem'
import ProblemInfo from '@/views/Problem/ProblemInfo'
import ProblemSubmit from '@/views/Problem/Submit'
import ProblemStatistics from '@/views/Problem/Statistics'
import ProblemEdit from '@/views/Problem/problemEdit'

// contests
import ContestList from '@/views/ContestList'
import Contest from '@/views/Contest/Contest'
import ContestOverview from '@/views/Contest/ContestOverview'
import ContestProblem from '@/views/Contest/ContestProblem'
import ContestSubmit from '@/views/Contest/ContestSubmit'
import ContestStatus from '@/views/Contest/ContestStatus'
import ContestRanklist from '@/views/Contest/ContestRanklist'
import ContestEdit from '@/views/Contest/ContestEdit'

// status & solution & ranklist & user & news
import Status from '@/views/Status'
import Solution from '@/views/Solution'
import Ranklist from '@/views/Ranklist'
import UserInfo from '@/views/UserInfo'

// admin
import ProblemCreate from '@/views/Admin/ProblemCreate'
import ContestCreate from '@/views/Admin/ContestCreate'

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
      path: '/problems/create', // 这个路由是不是要这样设计? 可能要讨论一下
      name: 'problemCreate',
      component: ProblemCreate
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
    },
    {
      path: '/ranklist',
      name: 'ranklist',
      component: Ranklist
    },
    {
      path: '/user/:uid',
      name: 'userInfo',
      component: UserInfo
    },
    {
      path: '/contest',
      name: 'contestList',
      component: ContestList
    },
    {
      path: '/contest/create',
      name: 'contestCreate',
      component: ContestCreate
    },
    {
      path: '/contests/:cid',
      component: Contest,
      children: [
        {
          path: '',
          name: 'contestOverview',
          component: ContestOverview
        },
        {
          path: 'problem/:id',
          name: 'contestProblem',
          component: ContestProblem
        },
        {
          path: 'problem/:id/submit',
          name: 'contestSubmit',
          component: ContestSubmit
        },
        {
          path: 'status',
          name: 'contestStatus',
          component: ContestStatus
        },
        {
          path: 'ranklist',
          name: 'contestRanklist',
          component: ContestRanklist
        },
        {
          path: 'edit',
          name: 'contestEdit',
          component: ContestEdit
        }
      ]
    }
  ]
})
