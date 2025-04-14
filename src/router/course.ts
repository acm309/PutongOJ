import type { RouteRecordRaw } from 'vue-router'

const Courses = () => import('@/views/Course/Courses.vue')

const courseRoutes: Array<RouteRecordRaw> = [
  {
    path: '/courses',
    name: 'Courses',
    component: Courses,
    meta: { title: 'Courses' },
  },
]

export default courseRoutes
