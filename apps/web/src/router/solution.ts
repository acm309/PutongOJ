import type { RouteRecordRaw } from 'vue-router'

import Solution from '@/views/Solution.vue'

const statusRoutes: Array<RouteRecordRaw> = [
  {
    path: '/solution',
    redirect: { name: 'MySubmissions' },
  },
  {
    path: '/solution/:sid',
    name: 'solution',
    component: Solution,
    meta: { title: 'Solution Detail' },
  },
]

export default statusRoutes
