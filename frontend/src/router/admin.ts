import type { RouteRecordRaw } from 'vue-router'

const GroupManagement = () => import('@/views/Admin/GroupManagement.vue')
const TagManager = () => import('@/views/Admin/TagManager.vue')
const UserManagement = () => import('@/views/Admin/UserManagement.vue')
const UserManagementDetail = () => import('@/views/Admin/UserManagementDetail.vue')
const SolutionManagement = () => import('@/views/Admin/SolutionManagement.vue')
const NotificationCreate = () => import('@/views/Admin/NotificationCreate.vue')

const adminRoutes: Array<RouteRecordRaw> = [
  {
    path: '/admin/groups',
    name: 'GroupManagement',
    component: GroupManagement,
    meta: { title: 'User Group Management', requiresAdmin: true },
  },
  {
    path: '/admin/tags',
    name: 'tagManager',
    component: TagManager,
    meta: { title: 'Problem Tag Manage', requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: 'User Management', requiresAdmin: true },
  },
  {
    path: '/admin/users/:uid',
    name: 'UserManagementDetail',
    component: UserManagementDetail,
    meta: { title: 'User Management', requiresAdmin: true },
  },
  {
    path: '/admin/solutions',
    name: 'SolutionManagement',
    component: SolutionManagement,
    meta: { title: 'Solution Management', requiresAdmin: true },
  },
  {
    path: '/admin/notifications/create',
    name: 'NotificationCreate',
    component: NotificationCreate,
    meta: { title: 'Create Notification', requiresAdmin: true },
  },
]

export default adminRoutes
