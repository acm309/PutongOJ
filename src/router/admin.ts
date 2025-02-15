import { RouteRecordRaw } from 'vue-router'

const AdminEdit = () => import('@/views/Admin/UserManage/AdminEdit.vue')
const GroupEdit = () => import('@/views/Admin/UserManage/GroupEdit.vue')
const TagEdit = () => import('@/views/Admin/UserManage/TagEdit.vue')
const UserEdit = () => import('@/views/Admin/UserManage/UserEdit.vue')
const UserManage = () => import('@/views/Admin/UserManage/UserManage.vue')

const adminRoutes: Array<RouteRecordRaw> = [
  {
    path: '/manage/user',
    component: UserManage,
    meta: { title: 'Admin', requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'userManage',
        component: UserManage,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/userEdit',
        name: 'adminUserEdit',
        component: UserEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/groupEdit',
        name: 'groupEdit',
        component: GroupEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/adminEdit',
        name: 'adminEdit',
        component: AdminEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
      {
        path: '/tagEdit',
        name: 'tagEdit',
        component: TagEdit,
        meta: { title: 'Admin', requiresAdmin: true },
      },
    ],
  },
]

export default adminRoutes
