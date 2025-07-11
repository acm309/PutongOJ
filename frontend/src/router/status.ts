import type { RouteRecordRaw } from 'vue-router'

import Solution from '@/views/Solution.vue'
import Status from '@/views/Status.vue'

const statusRoutes: Array<RouteRecordRaw> = [
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
]

export default statusRoutes
