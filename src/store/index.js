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

const state = {
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

const actions = {
  changeDomTitle ({ commit, rootState }, payload) {
    if (payload && payload.title) {
      window.document.title = payload.title
    } else {
      window.document.title = state.route.meta.title
    }
  }
}

export default new Vuex.Store({
  state,
  getters,
  actions,
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
