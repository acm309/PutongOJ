import Vue from 'vue'
import Vuex from 'vuex'
import * as types from './types'
import session from './modules/session'
import problem from './modules/problem'
import news from './modules/news'
import solution from './modules/solution'
import user from './modules/user'
import statistics from './modules/statistics'
import ranklist from './modules/ranklist'
import contest from './modules/contest'

Vue.use(Vuex)

// 初始化时用sessionStorage.getItem('token')，这样子刷新页面就无需重新登录
const state = {
  isShow: false
}

const getters = {
  isShow: state => state.isShow
}

const mutations = {
  [types.SHOW_DIALOG]: (state) => {
    state.isShow = true
  },
  [types.CLOSE_DIALOG]: (state) => {
    state.isShow = false
  }
}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  modules: {
    session,
    problem,
    news,
    solution,
    user,
    statistics,
    ranklist,
    contest
  }
})
