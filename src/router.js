import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from './views/Home.vue'
import Problems from './views/Problems.vue'
import Status from './views/Status.vue'
import Contests from './views/Contests.vue'
import Ranklist from './views/Ranklist.vue'
import FAQ from './views/FAQ.vue'

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
import Admin from './views/Admin/Admin.vue'
import AdminBoard from './views/Admin/Board.vue'
import AdminNewsList from './views/Admin/AdminNewsList.vue'
import AdminNewsAdd from './views/Admin/AdminNewsAdd.vue'
import AdminNewsEdit from './views/Admin/AdminNewsEdit.vue'
import AdminProblemsList from './views/Admin/AdminProblemsList.vue'
import AdminProblemAdd from './views/Admin/AdminProblemAdd.vue'
import AdminProblemsEdit from './views/Admin/AdminProblemsEdit.vue'
import AdminContestsList from './views/Admin/AdminContestsList.vue'
import AdminContestsAdd from './views/Admin/AdminContestsAdd.vue'
import AdminUsersPrivilege from './views/Admin/AdminUsersPrivilege.vue'
import AdminUsersPassword from './views/Admin/AdminUsersPassword.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Home,
    name: 'home',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit
    })
  }, {
    path: '/problems',
    component: Problems,
    name: 'problems',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit,
      field: route.query.field,
      query: route.query.query
    })
  }, {
    path: '/status',
    component: Status,
    name: 'status',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit,
      uid: route.query.uid,
      pid: route.query.pid,
      language: route.query.language,
      judge: route.query.judge
    })
  }, {
    path: '/ranklist',
    component: Ranklist,
    name: 'ranklist',
    props: (route) => ({
      page: route.query.page,
      limit: route.query.limit
    })
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
    props: (route) => ({
      nid: route.params.nid
    })
  }, {
    path: '/problems/:pid',
    component: Problem,
    name: 'problem',
    props: (route) => ({
      pid: route.params.pid
    })
  }, {
    path: '/statistics/:pid',
    component: Statistics,
    name: 'statistics',
    props: (route) => ({
      pid: route.params.pid
    })
  }, {
    path: '/users/:uid',
    component: User,
    props: (route) => ({
      uid: route.params.uid
    }),
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
    props: (route) => ({
      cid: route.params.cid
    }),
    children: [{
      path: '',
      // Warning: 这是默认子路由，导航时这个 name 放在子路由里，别放在上一代路由里
      name: 'contest',
      component: ContestOverview,
      props: (route) => ({
        cid: route.params.cid
      })
    }, {
      path: 'ranklist',
      name: 'contest_ranklist',
      component: ContestRanklist,
      props: (route) => ({
        cid: route.params.cid
      })
    }, {
      path: 'problems/:pid',
      name: 'contest_problem',
      component: ContestProblem,
      props: (route) => ({
        cid: route.params.cid,
        pid: route.params.pid
      })
    }, {
      path: 'status',
      name: 'contest_status',
      component: ContestStatus,
      props: (route) => ({
        cid: route.params.cid,
        page: route.query.page,
        limit: route.query.limit,
        uid: route.query.uid,
        pid: route.query.pid,
        language: route.query.language,
        judge: route.query.judge
      })
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
      props: (route) => ({
        nid: route.params.nid
      })
    }, {
      name: 'admin_news_add',
      component: AdminNewsAdd,
      path: 'news/add'
    }, {
      path: 'problems',
      component: AdminProblemsList,
      name: 'admin_problems_list',
      props: (route) => ({
        page: route.query.page,
        limit: route.query.limit
      })
    }, {
      path: 'problems/:pid',
      component: AdminProblemsEdit,
      name: 'admin_problems_edit',
      props: (route) => ({
        pid: route.params.pid
      })
    }, {
      path: 'problems/add',
      component: AdminProblemAdd,
      name: 'admin_problems_add'
    }, {
      path: 'contests',
      component: AdminContestsList,
      name: 'admin_contests_list',
      props: (route) => ({
        page: route.query.page,
        limit: route.query.limit
      })
    }, {
      path: 'contests/add',
      component: AdminContestsAdd,
      name: 'admin_contests_add'
    }, {
      path: 'users/privilege',
      component: AdminUsersPrivilege,
      name: 'admin_users_privilege'
    }, {
      path: 'users/password',
      component: AdminUsersPassword,
      name: 'admin_users_password'
    }]
  }
]

export default new VueRouter({
  mode: 'history',
  routes,
  linkExactActiveClass: 'is-active',
  linkActiveClass: 'is-active'
})
