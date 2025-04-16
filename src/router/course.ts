import type { RouteRecordRaw } from 'vue-router'

const Courses = () => import('@/views/Course/Courses.vue')
const Course = () => import('@/views/Course/Course.vue')

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
    component: Course,
    meta: { title: 'Course', requiresLogin: true },
  },
]

export default courseRoutes
