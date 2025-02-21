import type { RouteRecordRaw } from 'vue-router'

const AdminEdit = () => import('@/views/Admin/UserManage/AdminEdit.vue')
const GroupManager = () => import('@/views/Admin/GroupManager.vue')
const TagManager = () => import('@/views/Admin/TagManager.vue')
const UserEdit = () => import('@/views/Admin/UserManage/UserEdit.vue')

const adminRoutes: Array<RouteRecordRaw> = [
  {
    path: '/admin/groups',
    name: 'groupManager',
    component: GroupManager,
    meta: { title: 'User Group Edit', requiresAdmin: true },
  },
  {
    path: '/admin/tags',
    name: 'tagManager',
    component: TagManager,
    meta: { title: 'Admin', requiresAdmin: true },
  },
  {
    path: '/userEdit',
    name: 'adminUserEdit',
    component: UserEdit,
    meta: { title: 'Admin', requiresAdmin: true },
  },
  {
    path: '/adminEdit',
    name: 'adminEdit',
    component: AdminEdit,
    meta: { title: 'Admin', requiresAdmin: true },
  },
]

export default adminRoutes
