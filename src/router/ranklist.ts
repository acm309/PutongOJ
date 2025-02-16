import type { RouteRecordRaw } from 'vue-router'

import Ranklist from '@/views/Ranklist.vue'

const ranklistRoutes: Array<RouteRecordRaw> = [
  {
    path: '/ranklist',
    name: 'ranklist',
    component: Ranklist,
    meta: { title: 'Ranklist' },
  },
]

export default ranklistRoutes
