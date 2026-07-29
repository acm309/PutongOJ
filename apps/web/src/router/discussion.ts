import type { RouteRecordRaw } from 'vue-router'
import DiscussionDetail from '@/views/Discussion/DiscussionDetail.vue'
import Discussions from '@/views/Discussion/Discussions.vue'

const discussionRoutes: Array<RouteRecordRaw> = [
  {
    path: '/discussions',
    name: 'Discussions',
    component: Discussions,
    meta: { title: 'Discussions' },
  },
  {
    path: '/discussions/:discussionId',
    name: 'DiscussionDetail',
    component: DiscussionDetail,
    meta: { title: 'Discussion Detail' },
  },
]

export default discussionRoutes
