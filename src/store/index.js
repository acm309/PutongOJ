import Vue from 'vue'
import Vuex from 'vuex'
import session from './modules/session'
import problem from './modules/problem'
import news from './modules/news'
import solution from './modules/solution'
import user from './modules/user'
import statistics from './modules/statistics'
import ranklist from './modules/ranklist'
import contest from './modules/contest'
import group from './modules/group'
import testcase from './modules/testcase'

Vue.use(Vuex)

// 初始化时用localStorage.getItem('token')，这样子刷新页面就无需重新登录
const state = {
  token: window.localStorage.getItem('token')
}

const getters = {
  privilege: state => ({
    PrimaryUser: 1,
    Teacher: 2,
    Root: 3
  }),
  status: state => ({
    Reserve: 0,
    Available: 2
  })
}

export default new Vuex.Store({
  state,
  getters,
  modules: {
    session,
    problem,
    news,
    solution,
    user,
    statistics,
    ranklist,
    contest,
    group,
    testcase
  }
})
