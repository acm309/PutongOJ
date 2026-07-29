import type { RouteRecordRaw } from 'vue-router'

const GroupManagement = () => import('@/views/Admin/GroupManagement.vue')
const PostManagement = () => import('@/views/Admin/PostManagement.vue')
const PostManagementDetail = () => import('@/views/Admin/PostManagementDetail.vue')
const TagManager = () => import('@/views/Admin/TagManager.vue')
const UserManagement = () => import('@/views/Admin/UserManagement.vue')
const UserManagementDetail = () => import('@/views/Admin/UserManagementDetail.vue')
const SolutionManagement = () => import('@/views/Admin/SolutionManagement.vue')
const NotificationCreate = () => import('@/views/Admin/NotificationCreate.vue')
const FileManagement = () => import('@/views/Admin/FileManagement.vue')

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
    path: '/admin/posts',
    name: 'PostManagement',
    component: PostManagement,
    meta: { title: 'Post Management', requiresAdmin: true },
  },
  {
    path: '/admin/posts/:slug',
    name: 'PostManagementDetail',
    component: PostManagementDetail,
    meta: { title: 'Post Edit', requiresAdmin: true },
  },
  {
    path: '/admin/notifications/create',
    name: 'NotificationCreate',
    component: NotificationCreate,
    meta: { title: 'Create Notification', requiresAdmin: true },
  },
  {
    path: '/admin/files',
    name: 'FileManagement',
    component: FileManagement,
    meta: { title: 'File Management', requiresAdmin: true },
  },
]

export default adminRoutes
