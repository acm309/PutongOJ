import type { RouteRecordRaw } from 'vue-router'

import User from '@/views/User/User.vue'
import UserEdit from '@/views/User/UserEdit.vue'
import UserProfile from '@/views/User/UserProfile.vue'

const userRoutes: Array<RouteRecordRaw> = [
  {
    path: '/user/:uid',
    component: User,
    children: [
      {
        path: '',
        name: 'userProfile',
        component: UserProfile,
        meta: { title: 'User Profile' },
      },
      {
        path: 'edit',
        name: 'userEdit',
        component: UserEdit,
        meta: { title: 'Edit User' },
      },
    ],
  },
]

export default userRoutes
