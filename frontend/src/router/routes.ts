import type { RouteRecordRaw } from 'vue-router'
import NotFound from '@/views/404.vue'
import AccountSettings from '@/views/AccountSettings.vue'
import Home from '@/views/Home.vue'
import MySubmissions from '@/views/MySubmissions.vue'
import OAuthCallback from '@/views/OAuthCallback.vue'
import Ranklist from '@/views/Ranklist.vue'
import UserProfile from '@/views/UserProfile.vue'
import adminRoutes from './admin'
import contestRoutes from './contest'
import courseRoutes from './course'
import discussionRoutes from './discussion'
import newsRoutes from './news'
import problemRoutes from './problem'
import solutionRoutes from './solution'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: 'Home' },
  },
  ...newsRoutes,
  ...problemRoutes,
  ...solutionRoutes,
  ...contestRoutes,
  ...discussionRoutes,
  ...courseRoutes,
  ...adminRoutes,
  {
    path: '/users/ranklist',
    name: 'Ranklist',
    component: Ranklist,
    meta: { title: 'Ranklist' },
  },
  {
    path: '/ranklist',
    redirect: { name: 'Ranklist' },
  },
  {
    path: '/users/:uid',
    name: 'UserProfile',
    component: UserProfile,
    meta: { title: 'User Profile' },
  },
  {
    path: '/user/:uid',
    redirect: { name: 'UserProfile' },
  },
  {
    path: '/submissions',
    name: 'MySubmissions',
    component: MySubmissions,
    meta: { title: 'My Submissions', requiresLogin: true },
  },
  {
    path: '/settings',
    name: 'AccountSettings',
    component: AccountSettings,
    meta: { title: 'Account Settings', requiresLogin: true },
  },
  {
    path: '/oauth/:provider/callback',
    name: 'oauthCallback',
    component: OAuthCallback,
    meta: { title: 'OAuth Callback' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFound,
    meta: { title: '404' },
  },
]

export default routes
