import type { RouteRecordRaw } from 'vue-router'

import Courses from '@/views/Courses.vue'

const Layout = () => import('@/views/Course/Layout.vue')

const courseRoutes: Array<RouteRecordRaw> = [
  {
    path: '/courses',
    name: 'courses',
    component: Courses,
    meta: { title: 'Courses' },
  },
  {
    path: '/course/:id(\\d+)',
    name: 'course',
    component: Layout,
    meta: { title: 'Course', requiresLogin: true },
  },
]

export default courseRoutes
