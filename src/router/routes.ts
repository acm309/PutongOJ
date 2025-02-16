import type { RouteRecordRaw } from 'vue-router'

import newsRoutes from './news'
import problemRoutes from './problem'
import statusRoutes from './status'
import ranklistRoutes from './ranklist'
import contestRoutes from './contest'
import discussRoutes from './discuss'
import userRoutes from './user'
import adminRoutes from './admin'

import NotFound from '@/views/404.vue'
import FAQ from '@/views/FAQ.vue'
import Home from '@/views/Home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Home' },
  },
  ...newsRoutes,
  ...problemRoutes,
  ...statusRoutes,
  ...ranklistRoutes,
  ...contestRoutes,
  ...discussRoutes,
  ...userRoutes,
  ...adminRoutes,
  {
    path: '/faq',
    name: 'faq',
    component: FAQ,
    meta: { title: 'FAQ' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFound,
    meta: { title: '404' },
  },
]

export default routes
