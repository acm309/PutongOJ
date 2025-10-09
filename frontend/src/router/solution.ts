import type { RouteRecordRaw } from 'vue-router'

import Solution from '@/views/Solution.vue'
import Status from '@/views/Status.vue'

const statusRoutes: Array<RouteRecordRaw> = [
  {
    path: '/solution',
    name: 'status',
    component: Status,
    meta: { title: 'Solutions' },
  },
  {
    path: '/solution/:sid',
    name: 'solution',
    component: Solution,
    meta: { title: 'Solution Detail' },
  },
]

export default statusRoutes
