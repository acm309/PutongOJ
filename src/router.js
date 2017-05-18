import Vue from 'vue'
import VueRouter from 'vue-router'

import NProgress from 'nprogress'

import Home from './views/Home.vue'
import Problems from './views/Problems.vue'
import Status from './views/Status.vue'
import Contests from './views/Contests.vue'
import Ranklist from './views/Ranklist.vue'
import FAQ from './views/FAQ.vue'
import NotFound from './views/NotFound.vue'

import News from './views/News.vue'
import Problem from './views/Problem.vue'
import Statistics from './views/Statistics.vue'
import User from './views/User/User.vue'
import UserProfile from './views/User/UserProfle.vue'
import UserEdit from './views/User/UserEdit.vue'
import Register from './views/Register.vue'
import Contest from './views/Contest/Contest.vue'
import ContestOverview from './views/Contest/ContestOverview.vue'
import ContestRanklist from './views/Contest/ContestRanklist.vue'
import ContestProblem from './views/Contest/ContestProblem.vue'
import ContestStatus from './views/Contest/ContestStatus.vue'

const Admin = r => require.ensure([], () => r(require('./views/Admin/Admin.vue')), 'admin')
const AdminBoard = r => require.ensure([], () => r(require('./views/Admin/Board.vue')), 'admin')
const AdminNewsList = r => require.ensure([], () => r(require('./views/Admin/AdminNewsList.vue')), 'admin')
const AdminNewsAdd = r => require.ensure([], () => r(require('./views/Admin/AdminNewsAdd.vue')), 'admin')
const AdminNewsEdit = r => require.ensure([], () => r(require('./views/Admin/AdminNewsEdit.vue')), 'admin')
const AdminProblemsList = r => require.ensure([], () => r(require('./views/Admin/AdminProblemsList.vue')), 'admin')
const AdminProblemAdd = r => require.ensure([], () => r(require('./views/Admin/AdminProblemAdd.vue')), 'admin')
const AdminProblemsTestData = r => require.ensure([], () => r(require('./views/Admin/AdminProblemsTestData.vue')), 'admin')
const AdminProblemsEdit = r => require.ensure([], () => r(require('./views/Admin/AdminProblemsEdit.vue')), 'admin')
const AdminContestsList = r => require.ensure([], () => r(require('./views/Admin/AdminContestsList.vue')), 'admin')
const AdminContestsAdd = r => require.ensure([], () => r(require('./views/Admin/AdminContestsAdd.vue')), 'admin')
const AdminContestsEdit = r => require.ensure([], () => r(require('./views/Admin/AdminContestsEdit.vue')), 'admin')
const AdminUsersPrivilege = r => require.ensure([], () => r(require('./views/Admin/AdminUsersPrivilege.vue')), 'admin')
const AdminUsersPassword = r => require.ensure([], () => r(require('./views/Admin/AdminUsersPassword.vue')), 'admin')

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Home,
    name: 'home',
    props: (route) => route.query
  }, {
    path: '/problems',
    component: Problems,
    name: 'problems',
    props: (route) => route.query
  }, {
    path: '/status',
    component: Status,
    name: 'status',
    props: (route) => route.query
  }, {
    path: '/ranklist',
    component: Ranklist,
    name: 'ranklist',
    props: (route) => route.query
  }, {
    path: '/contests',
    component: Contests,
    name: 'contests'
  }, {
    path: '/faq',
    component: FAQ,
    name: 'faq'
  }, {
    path: '/news/:nid',
    component: News,
    name: 'news',
    props: true // passing params
  }, {
    path: '/problems/:pid',
    component: Problem,
    name: 'problem',
    props: true
  }, {
    path: '/statistics/:pid',
    component: Statistics,
    name: 'statistics',
    props: true
  }, {
    path: '/users/:uid',
    component: User,
    props: true,
    children: [{
      path: '',
      component: UserProfile,
      name: 'user'
    }, {
      path: 'edit',
      component: UserEdit,
      name: 'useredit'
    }]
  }, {
    path: '/register',
    component: Register,
    name: 'register'
  }, {
    path: '/contests/:cid',
    component: Contest,
    props: true,
    children: [{
      path: '',
      // Warning: 这是默认子路由，导航时这个 name 放在子路由里，别放在上一代路由里
      name: 'contest',
      component: ContestOverview,
      props: true
    }, {
      path: 'ranklist',
      name: 'contest_ranklist',
      component: ContestRanklist,
      props: true
    }, {
      path: 'problems/:pid',
      name: 'contest_problem',
      component: ContestProblem,
      props: true
    }, {
      path: 'status',
      name: 'contest_status',
      component: ContestStatus,
      props: (route) => Object.assign({}, route.params, route.query)
    }]
  }, {
    path: '/admin',
    component: Admin,
    children: [{
      name: 'admin',
      component: AdminBoard,
      path: ''
    }, {
      name: 'admin_news_list',
      component: AdminNewsList,
      path: 'news'
    }, {
      name: 'admin_news_edit',
      component: AdminNewsEdit,
      path: 'news/:nid',
      props: true
    }, {
      name: 'admin_news_add',
      component: AdminNewsAdd,
      path: 'news/add'
    }, {
      path: 'problems',
      component: AdminProblemsList,
      name: 'admin_problems_list',
      props: (route) => route.query
    }, {
      path: 'problems/add',
      component: AdminProblemAdd,
      name: 'admin_problems_add'
    }, {
      path: 'problems/:pid',
      component: AdminProblemsEdit,
      name: 'admin_problems_edit',
      props: true
    }, {
      path: 'problems/:pid/testdata',
      component: AdminProblemsTestData,
      name: 'admin_problems_testdata',
      props: true
    }, {
      path: 'contests',
      component: AdminContestsList,
      name: 'admin_contests_list',
      props: (route) => route.query
    }, {
      path: 'contests/add',
      component: AdminContestsAdd,
      name: 'admin_contests_add'
    }, {
      path: 'contests/:cid',
      component: AdminContestsEdit,
      name: 'admin_contests_edit',
      props: true
    }, {
      path: 'users/privilege',
      component: AdminUsersPrivilege,
      name: 'admin_users_privilege'
    }, {
      path: 'users/password',
      component: AdminUsersPassword,
      name: 'admin_users_password'
    }]
  }, {
    path: '*',
    component: NotFound,
    name: 'not_found'
  }
]

const router = new VueRouter({
  mode: 'history',
  routes,
  linkExactActiveClass: 'is-active',
  linkActiveClass: 'is-active'
})

NProgress.configure({ speed: 400 })

router.beforeEach((to, from, next) => {
  NProgress.start()
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
