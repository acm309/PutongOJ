import Home from '@/views/Home'

// problems
import ProblemList from '@/views/ProblemList'
import Problem from '@/views/Problem/Problem'
import ProblemInfo from '@/views/Problem/ProblemInfo'
import ProblemSubmit from '@/views/Problem/ProblemSubmit'
import ProblemStatistics from '@/views/Problem/Statistics'
import ProblemEdit from '@/views/Problem/problemEdit'
import MySubmission from '@/views/Problem/Mysubmission'
import Testcase from '@/views/Problem/Testcase'

// contests
import ContestList from '@/views/ContestList'
import Contest from '@/views/Contest/Contest'
import ContestOverview from '@/views/Contest/ContestOverview'
import ContestProblem from '@/views/Contest/ContestProblem'
import ContestSubmit from '@/views/Contest/ContestSubmit'
import ContestStatus from '@/views/Contest/ContestStatus'
import ContestRanklist from '@/views/Contest/ContestRanklist'
import ContestEdit from '@/views/Contest/ContestEdit'

// news
import News from '@/views/News/News'
import NewsInfo from '@/views/News/NewsInfo'
import NewsEdit from '@/views/News/NewsEdit'

// status & solution & ranklist & user & news
import Status from '@/views/Status'
import Solution from '@/views/Solution'
import Ranklist from '@/views/Ranklist'
import UserInfo from '@/views/UserInfo'

// admin
import ProblemCreate from '@/views/Admin/ProblemCreate'
import ContestCreate from '@/views/Admin/ContestCreate'
import NewsCreate from '@/views/Admin/NewsCreate'
import UserManage from '@/views/Admin/UserManage'

export default [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/news/:nid',
    component: News,
    children: [
      {
        path: '',
        name: 'newsInfo',
        component: NewsInfo
      },
      {
        path: 'edit',
        name: 'newsEdit',
        meta: { requiresAdmin: true },
        component: NewsEdit
      }
    ]
  },
  {
    path: '/news/create',
    name: 'newsCreate',
    meta: { requiresAdmin: true },
    component: NewsCreate
  },
  {
    path: '/problems',
    name: 'problemList',
    component: ProblemList
  },
  {
    path: '/problems/create', // 这个路由是不是要这样设计? 可能要讨论一下
    name: 'problemCreate',
    meta: { requiresAdmin: true },
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
        path: 'mySubmission',
        name: 'mySubmission',
        component: MySubmission
      },
      {
        path: 'statistics',
        name: 'problemStatistics',
        component: ProblemStatistics
      },
      {
        path: 'edit',
        name: 'problemEdit',
        meta: { requiresAdmin: true },
        component: ProblemEdit
      },
      {
        path: 'testcase',
        name: 'testcase',
        component: Testcase
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
    path: '/manage/user',
    name: 'userManage',
    meta: { requiresAdmin: true },
    component: UserManage
  },
  {
    path: '/contest',
    name: 'contestList',
    component: ContestList
  },
  {
    path: '/contest/create',
    name: 'contestCreate',
    meta: { requiresAdmin: true },
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
        meta: { requiresAdmin: true },
        component: ContestEdit
      }
    ]
  }
]
