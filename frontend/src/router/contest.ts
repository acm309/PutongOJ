import type { RouteRecordRaw } from 'vue-router'
import Contest from '@/views/Contest/Contest.vue'
import ContestHeader from '@/views/Contest/ContestHeader.vue'
import ContestOverview from '@/views/Contest/ContestOverview.vue'
import ContestProblem from '@/views/Contest/ContestProblem.vue'
import ContestRanklist from '@/views/Contest/ContestRanklist.vue'
import Contests from '@/views/Contest/Contests.vue'
import ContestSubmit from '@/views/Contest/ContestSubmit.vue'
import ContestDiscussions from '@/views/Contest/Discussions.vue'
import ContestMySubmissions from '@/views/Contest/MySubmissions.vue'
import ContestSolutions from '@/views/Contest/Solutions.vue'

const ContestEdit = () => import('@/views/Contest/ContestEdit.vue')

const contestRoutes: Array<RouteRecordRaw> = [
  {
    path: '/contests',
    name: 'Contests',
    component: Contests,
    meta: { title: 'Contests' },
  },
  {
    path: '/contests/:contestId',
    components: {
      default: Contest,
      extraHeader: ContestHeader,
    },
    meta: { requiresLogin: true },
    children: [
      {
        path: '',
        name: 'ContestOverview',
        component: ContestOverview,
        meta: { requiresLogin: true },
      },
      {
        path: 'problem/:problemId',
        name: 'contestProblem',
        component: ContestProblem,
        meta: { title: 'Contest Info', requiresLogin: true },
      },
      {
        path: 'problem/:problemId/submit',
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
        component: ContestDiscussions,
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
