import type { RouteRecordRaw } from 'vue-router'

import Courses from '@/views/Courses.vue'

const Layout = () => import('@/views/Course/Layout.vue')
const Problems = () => import('@/views/Course/Problems.vue')
const Members = () => import('@/views/Course/Members.vue')

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
    meta: { requiresLogin: true },
    children: [
      {
        path: '',
        name: 'courseProblems',
        component: Problems,
        meta: { title: 'Course Problems', requiresLogin: true },
      },
      {
        path: 'members',
        name: 'courseMembers',
        component: Members,
        meta: { title: 'Course Members', requiresLogin: true },
      },
      {
        path: 'settings',
        name: 'courseSettings',
        component: () => import('@/views/Course/Settings.vue'),
        meta: { title: 'Course Settings', requiresLogin: true },
      },
    ],
  },
]

export default courseRoutes
