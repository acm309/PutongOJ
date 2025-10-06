import type { RouteRecordRaw } from 'vue-router'

const GroupManager = () => import('@/views/Admin/GroupManager.vue')
const TagManager = () => import('@/views/Admin/TagManager.vue')
const UserManagement = () => import('@/views/Admin/UserManagement.vue')
const UserManagementDetail = () => import('@/views/Admin/UserManagementDetail.vue')

const adminRoutes: Array<RouteRecordRaw> = [
  {
    path: '/admin/groups',
    name: 'groupManager',
    component: GroupManager,
    meta: { title: 'User Group Manage', requiresAdmin: true },
  },
  {
    path: '/admin/tags',
    name: 'tagManager',
    component: TagManager,
    meta: { title: 'Problem Tag Manage', requiresAdmin: true },
  },
  {
    path: '/admin/user',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: 'User Management', requiresAdmin: true },
  },
  {
    path: '/admin/user/:uid',
    name: 'UserManagementDetail',
    component: UserManagementDetail,
    meta: { title: 'User Management', requiresAdmin: true },
  },
]

export default adminRoutes
