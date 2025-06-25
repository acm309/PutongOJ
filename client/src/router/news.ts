import type { RouteRecordRaw } from 'vue-router'

import News from '@/views/News/News.vue'
import NewsInfo from '@/views/News/NewsInfo.vue'

const NewsCreate = () => import('@/views/News/NewsCreate.vue')
const NewsEdit = () => import('@/views/News/NewsEdit.vue')

const newsRoutes: Array<RouteRecordRaw> = [
  {
    // `/news/create` must be placed before `/news/:nid`
    path: '/news/create',
    name: 'newsCreate',
    component: NewsCreate,
    meta: { title: 'Admin', requiresAdmin: true },
  },
  {
    path: '/news/:nid',
    component: News,
    children: [
      {
        path: '',
        name: 'newsInfo',
        component: NewsInfo,
        meta: { title: 'News' },
      },
      {
        path: 'edit',
        name: 'newsEdit',
        component: NewsEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
    ],
  },
]

export default newsRoutes
