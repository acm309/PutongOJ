import type { RouteRecordRaw } from 'vue-router'

import NotFound from '@/views/404.vue'
import FAQ from '@/views/FAQ.vue'
import Home from '@/views/Home.vue'
import OAuthCallback from '@/views/OAuthCallback.vue'

import adminRoutes from './admin'
import contestRoutes from './contest'
import courseRoutes from './course'
import discussRoutes from './discuss'
import newsRoutes from './news'
import problemRoutes from './problem'
import ranklistRoutes from './ranklist'
import statusRoutes from './status'
import userRoutes from './user'

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
  ...courseRoutes,
  ...adminRoutes,
  {
    path: '/oauth/:provider/callback',
    name: 'oauthCallback',
    component: OAuthCallback,
    meta: { title: 'OAuth Callback' },
  },
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
