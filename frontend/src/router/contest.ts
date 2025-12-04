import type { RouteRecordRaw } from 'vue-router'

import Contest from '@/views/Contest/Contest.vue'
import ContestOverview from '@/views/Contest/ContestOverview.vue'
import ContestProblem from '@/views/Contest/ContestProblem.vue'
import ContestRanklist from '@/views/Contest/ContestRanklist.vue'
import ContestSubmit from '@/views/Contest/ContestSubmit.vue'
import ContestMySubmissions from '@/views/Contest/MySubmissions.vue'
import ContestSolutions from '@/views/Contest/Solutions.vue'
import ContestList from '@/views/ContestList.vue'

const ContestCreate = () => import('@/views/Admin/ContestCreate.vue')
const ContestEdit = () => import('@/views/Contest/ContestEdit.vue')

const contestRoutes: Array<RouteRecordRaw> = [
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
    meta: { title: 'Admin', requiresLogin: true },
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
        path: 'submissions',
        name: 'ContestMySubmissions',
        component: ContestMySubmissions,
        meta: { requiresLogin: true },
      },
      {
        path: 'solutions',
        name: 'ContestSolutions',
        component: ContestSolutions,
        meta: { requiresLogin: true },
      },
      {
        path: 'discussions',
        name: 'ContestDiscussions',
        component: () => import('@/views/Contest/Discussions.vue'),
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
        meta: { title: 'Admin', requiresLogin: true },
        component: ContestEdit,
      },
    ],
  },
]

export default contestRoutes
