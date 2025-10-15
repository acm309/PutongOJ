import type { RouteRecordRaw } from 'vue-router'

const Discuss = () => import('@/views/Discuss/Discuss.vue')
const DiscussInfo = () => import('@/views/Discuss/DiscussInfo.vue')

const discussRoutes: Array<RouteRecordRaw> = [
  {
    path: '/discuss',
    name: 'discuss',
    component: Discuss,
    meta: { title: 'Discuss', requiresLogin: true },
  },
  {
    path: '/discuss/:did',
    name: 'discussInfo',
    component: DiscussInfo,
    props: route => route.params,
    meta: { title: 'Discuss Info', requiresLogin: true },
  },
]

export default discussRoutes
