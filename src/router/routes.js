import Home from '@/views/Home'
import NotFound from '@/views/404'

// problems
import ProblemList from '@/views/ProblemList'
import Problem from '@/views/Problem/Problem'
import ProblemInfo from '@/views/Problem/ProblemInfo'
import ProblemSubmit from '@/views/Problem/ProblemSubmit'
import MySubmission from '@/views/Problem/MySubmission'

// contests
import ContestList from '@/views/ContestList'
import Contest from '@/views/Contest/Contest'
import ContestOverview from '@/views/Contest/ContestOverview'
import ContestProblem from '@/views/Contest/ContestProblem'
import ContestSubmit from '@/views/Contest/ContestSubmit'
import ContestStatus from '@/views/Contest/ContestStatus'
import ContestRanklist from '@/views/Contest/ContestRanklist'

// news
import News from '@/views/News/News'

// user
import User from '@/views/User/User'
import UserProfile from '@/views/User/UserProfile'
import UserEdit from '@/views/User/UserEdit'

// discuss
import Discuss from '@/views/Discuss/Discuss'
import DiscussInfo from '@/views/Discuss/DiscussInfo'

// status & solution & ranklist & news & faq
import Status from '@/views/Status'
import Solution from '@/views/Solution'
import Ranklist from '@/views/Ranklist'
import FAQ from '@/views/FAQ'

// 路由懒加载
const AdminEdit = () => import('@/views/Admin/UserManage/AdminEdit')
const ContestCreate = () => import('@/views/Admin/ContestCreate')
const ContestEdit = () => import('@/views/Contest/ContestEdit')
const GroupEdit = () => import('@/views/Admin/UserManage/GroupEdit')
const NewsCreate = () => import('@/views/Admin/NewsCreate')
const NewsEdit = () => import('@/views/News/NewsEdit')
const NewsInfo = () => import('@/views/News/NewsInfo')
const ProblemCreate = () => import('@/views/Admin/ProblemCreate')
const ProblemEdit = () => import('@/views/Problem/ProblemEdit')
const ProblemStatistics = () => import('@/views/Problem/Statistics')
const TagEdit = () => import('@/views/Admin/UserManage/TagEdit')
const Testcase = () => import('@/views/Problem/Testcase')
const UserManage = () => import('@/views/Admin/UserManage/UserManage')

export default [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Home' },
  },
  // News create must be placed before /news/:nid
  {
    path: '/news/create',
    name: 'newsCreate',
    component: NewsCreate,
    meta: { title: 'Admin', requiresAdmin: true },
  },
  {
    path: '/news/:nid',
    component: News,
    children: [
      {
        path: '',
        name: 'newsInfo',
        component: NewsInfo,
        meta: { title: 'News' },
      },
      {
        path: 'edit',
        name: 'newsEdit',
        component: NewsEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
    ],
  },
  {
    path: '/problems',
    name: 'problemList',
    component: ProblemList,
    meta: { title: 'Problem List' },
  },
  {
    path: '/problems/create',
    name: 'problemCreate',
    component: ProblemCreate,
    meta: { title: 'Admin', requiresAdmin: true },
  },
  {
    path: '/problem/:pid',
    component: Problem,
    children: [
      {
        path: '',
        name: 'problemInfo',
        component: ProblemInfo,
        meta: { title: 'Problem Info' },
      },
      {
        path: 'submit',
        name: 'problemSubmit',
        component: ProblemSubmit,
        meta: { title: 'Problem Info' },
      },
      {
        path: 'mySubmission',
        name: 'mySubmission',
        component: MySubmission,
        meta: { title: 'Problem Info' },
      },
      {
        path: 'statistics',
        name: 'problemStatistics',
        component: ProblemStatistics,
        meta: { title: 'Problem Info' },
      },
      {
        path: 'discuss',
        name: 'Discuss',
        component: Discuss,
        meta: { title: 'Problem Info' },
      },
      {
        path: 'edit',
        name: 'problemEdit',
        component: ProblemEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: 'testcase',
        name: 'testcase',
        component: Testcase,
        meta: { title: 'Admin', requiresAdmin: true },
      },
    ],
  },
  {
    path: '/discuss',
    name: 'discuss',
    component: Discuss,
    meta: { title: 'Discuss' },
  },
  {
    path: '/discuss/:did',
    name: 'discussInfo',
    component: DiscussInfo,
    props: route => route.params,
    meta: { title: 'Discuss Info' },
  },
  {
    path: '/status',
    name: 'status',
    component: Status,
    meta: { title: 'Status' },
  },
  {
    path: '/status/:sid',
    name: 'solution',
    component: Solution,
    meta: { title: 'Solution Info' },
  },
  {
    path: '/ranklist',
    name: 'ranklist',
    component: Ranklist,
    meta: { title: 'Ranklist' },
  },
  {
    path: '/user/:uid',
    component: User,
    children: [
      {
        path: '',
        name: 'userProfile',
        component: UserProfile,
        meta: { title: 'User Profile' }
      },
      {
        path: 'edit',
        name: 'userEdit',
        component: UserEdit,
        meta: { title: 'Edit User' }
      }
    ]
  },
  {
    path: '/manage/user',
    component: UserManage,
    meta: { title: 'Admin', requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'usermanage',
        component: UserManage,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/userEdit',
        name: 'adminUserEdit',
        component: UserEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/groupEdit',
        name: 'groupEdit',
        component: GroupEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/adminEdit',
        name: 'adminEdit',
        component: AdminEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/tagEdit',
        name: 'tagEdit',
        component: TagEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
    ],
  },
  {
    path: '/contest',
    name: 'contestList',
    component: ContestList,
    meta: { title: 'Contest List' },
  },
  {
    path: '/contest/create',
    name: 'contestCreate',
    component: ContestCreate,
    meta: { title: 'Admin', requiresAdmin: true },
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
        meta: { title: 'Contest Info', requiresLogin: true },
      },
      {
        path: 'problem/:id',
        name: 'contestProblem',
        component: ContestProblem,
        meta: { title: 'Contest Info', requiresLogin: true },
      },
      {
        path: 'problem/:id/submit',
        name: 'contestSubmit',
        component: ContestSubmit,
        meta: { title: 'Contest Info', requiresLogin: true },
      },
      {
        path: 'status',
        name: 'contestStatus',
        component: ContestStatus,
        meta: { title: 'Contest Info', requiresLogin: true },
      },
      {
        path: 'ranklist',
        name: 'contestRanklist',
        component: ContestRanklist,
        meta: { title: 'Contest Info', requiresLogin: true },
      },
      {
        path: 'edit',
        name: 'contestEdit',
        meta: { title: 'Admin', requiresAdmin: true },
        component: ContestEdit,
      },
    ],
  },
  {
    path: '/faq',
    name: 'faq',
    component: FAQ,
    meta: { title: 'FAQ' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFound,
    meta: { title: '404' },
  },
]
