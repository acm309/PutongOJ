import Home from '@/views/Home'
import NotFound from '@/views/404'

// problems
import ProblemList from '@/views/ProblemList'
import Problem from '@/views/Problem/Problem'
import ProblemInfo from '@/views/Problem/ProblemInfo'
import ProblemSubmit from '@/views/Problem/ProblemSubmit'
import MySubmission from '@/views/Problem/Mysubmission'
// import ProblemStatistics from '@/views/Problem/Statistics'
// import ProblemEdit from '@/views/Problem/problemEdit'
// import Testcase from '@/views/Problem/Testcase'

// contests
import ContestList from '@/views/ContestList'
import Contest from '@/views/Contest/Contest'
import ContestOverview from '@/views/Contest/ContestOverview'
import ContestProblem from '@/views/Contest/ContestProblem'
import ContestSubmit from '@/views/Contest/ContestSubmit'
import ContestStatus from '@/views/Contest/ContestStatus'
import ContestRanklist from '@/views/Contest/ContestRanklist'
// import ContestEdit from '@/views/Contest/ContestEdit'

// news
import News from '@/views/News/News'
import NewsInfo from '@/views/News/NewsInfo'
// import NewsEdit from '@/views/News/NewsEdit'

// status & solution & ranklist & user & news & faq
import Status from '@/views/Status'
import Solution from '@/views/Solution'
import Ranklist from '@/views/Ranklist'
import UserInfo from '@/views/UserInfo'
import FAQ from '@/views/FAQ'

// admin
// import ProblemCreate from '@/views/Admin/ProblemCreate'
// import ContestCreate from '@/views/Admin/ContestCreate'
// import NewsCreate from '@/views/Admin/NewsCreate'
// import UserManage from '@/views/Admin/UserManage'

// 路由懒加载
const ProblemStatistics = r => require.ensure([], () => r(require('@/views/Problem/Statistics')), 'statistics')
const ProblemEdit = r => require.ensure([], () => r(require('@/views/Problem/ProblemEdit')), 'admin')
const Testcase = r => require.ensure([], () => r(require('@/views/Problem/Testcase')), 'admin')
const ContestEdit = r => require.ensure([], () => r(require('@/views/Contest/ContestEdit')), 'admin')
const NewsEdit = r => require.ensure([], () => r(require('@/views/News/NewsEdit')), 'admin')
const ProblemCreate = r => require.ensure([], () => r(require('@/views/Admin/ProblemCreate')), 'admin')
const ContestCreate = r => require.ensure([], () => r(require('@/views/Admin/ContestCreate')), 'admin')
const NewsCreate = r => require.ensure([], () => r(require('@/views/Admin/NewsCreate')), 'admin')
const UserManage = r => require.ensure([], () => r(require('@/views/Admin/UserManage')), 'admin')

export default [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Home' }
  },
  {
    path: '/news/:nid',
    component: News,
    children: [
      {
        path: '',
        name: 'newsInfo',
        component: NewsInfo,
        meta: { title: 'News' }
      },
      {
        path: 'edit',
        name: 'newsEdit',
        component: NewsEdit,
        meta: { title: 'Admin', requiresAdmin: true }
      }
    ]
  },
  {
    path: '/news/create',
    name: 'newsCreate',
    component: NewsCreate,
    meta: { title: 'Admin', requiresAdmin: true }
  },
  {
    path: '/problems',
    name: 'problemList',
    component: ProblemList,
    meta: { title: 'problem List' }
  },
  {
    path: '/problems/create', // 这个路由是不是要这样设计? 可能要讨论一下
    name: 'problemCreate',
    component: ProblemCreate,
    meta: { title: 'Admin', requiresAdmin: true }
  },
  {
    path: '/problem/:pid',
    component: Problem,
    children: [
      {
        path: '',
        name: 'problemInfo',
        component: ProblemInfo,
        meta: { title: 'Problem Info' }
      },
      {
        path: 'submit',
        name: 'problemSubmit',
        component: ProblemSubmit,
        meta: { title: 'Problem Info' }
      },
      {
        path: 'mySubmission',
        name: 'mySubmission',
        component: MySubmission,
        meta: { title: 'Problem Info' }
      },
      {
        path: 'statistics',
        name: 'problemStatistics',
        component: ProblemStatistics,
        meta: { title: 'Problem Info' }
      },
      {
        path: 'edit',
        name: 'problemEdit',
        component: ProblemEdit,
        meta: { title: 'Admin', requiresAdmin: true }
      },
      {
        path: 'testcase',
        name: 'testcase',
        component: Testcase,
        meta: { title: 'Admin', requiresAdmin: true }
      }
    ]
  },
  {
    path: '/status',
    name: 'status',
    component: Status,
    meta: { title: 'Status' }
  },
  {
    path: '/status/:sid',
    name: 'solution',
    component: Solution,
    meta: { title: 'Solution Info' }
  },
  {
    path: '/ranklist',
    name: 'ranklist',
    component: Ranklist,
    meta: { title: 'Ranklist' }
  },
  {
    path: '/user/:uid',
    name: 'userInfo',
    component: UserInfo,
    meta: { title: 'User Info' }
  },
  {
    path: '/manage/user',
    name: 'userManage',
    component: UserManage,
    meta: { title: 'Admin', requiresAdmin: true }
  },
  {
    path: '/contest',
    name: 'contestList',
    component: ContestList,
    meta: { title: 'Contest List' }
  },
  {
    path: '/contest/create',
    name: 'contestCreate',
    component: ContestCreate,
    meta: { title: 'Admin', requiresAdmin: true }
  },
  {
    path: '/contests/:cid',
    component: Contest,
    meta: { requiresLogin: true },
    children: [
      {
        path: '',
        name: 'contestOverview',
        component: ContestOverview,
        meta: { title: 'contest Info', requiresLogin: true }
      },
      {
        path: 'problem/:id',
        name: 'contestProblem',
        component: ContestProblem,
        meta: { title: 'contest Info', requiresLogin: true }
      },
      {
        path: 'problem/:id/submit',
        name: 'contestSubmit',
        component: ContestSubmit,
        meta: { title: 'contest Info', requiresLogin: true }
      },
      {
        path: 'status',
        name: 'contestStatus',
        component: ContestStatus,
        meta: { title: 'contest Info', requiresLogin: true }
      },
      {
        path: 'ranklist',
        name: 'contestRanklist',
        component: ContestRanklist,
        meta: { title: 'contest Info', requiresLogin: true }
      },
      {
        path: 'edit',
        name: 'contestEdit',
        meta: { title: 'Admin', requiresAdmin: true },
        component: ContestEdit
      }
    ]
  },
  {
    path: 'faq',
    name: 'faq',
    component: FAQ,
    meta: { title: 'FAQ' }
  },
  {
    path: '*',
    name: 'notFound',
    component: NotFound,
    meta: { title: '404' }
  }
]
