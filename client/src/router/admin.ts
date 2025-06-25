import type { RouteRecordRaw } from 'vue-router'

const AdminEdit = () => import('@/views/Admin/UserManage/AdminEdit.vue')
const GroupManager = () => import('@/views/Admin/GroupManager.vue')
const TagManager = () => import('@/views/Admin/TagManager.vue')
const UserManager = () => import('@/views/Admin/UserManager.vue')
const UserEdit = () => import('@/views/Admin/UserManage/UserEdit.vue')

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
    path: '/admin/users',
    name: 'userManager',
    component: UserManager,
    meta: { title: 'User Manage', requiresAdmin: true },
  },
  {
    path: '/userEdit',
    name: 'adminUserEdit',
    component: UserEdit,
    meta: { title: 'User Edit (Legacy)', requiresAdmin: true },
  },
  {
    path: '/adminEdit',
    name: 'adminEdit',
    component: AdminEdit,
    meta: { title: 'Admin Edit (Legacy)', requiresAdmin: true },
  },
]

export default adminRoutes
