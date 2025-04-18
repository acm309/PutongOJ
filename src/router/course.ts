import type { RouteRecordRaw } from 'vue-router'

import Courses from '@/views/Courses.vue'

const Layout = () => import('@/views/Course/Layout.vue')
const Member = () => import('@/views/Course/Member.vue')

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
        path: 'members',
        name: 'courseMember',
        component: Member,
        meta: { title: 'Course Member', requiresLogin: true },
      }
    ],
  },
]

export default courseRoutes
