import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import modules from './modules'

Vue.use(Vuex)

axios.defaults.baseURL = 'http://127.0.0.1:3000/api/'
axios.defaults.withCredentials = true

const state = {
  currentTime: Date.now(),
  loginModalActive: false,
  defaultLanguage: 1
}

const getters = {
  currentTime: (state) => state.currentTime,
  loginModalActive: (state) => state.loginModalActive,
  judges: (state) => ({
    0: 'Pending',
    1: 'Running & Judge',
    2: 'Compile Error',
    3: 'Accepted',
    4: 'Runtime Error',
    5: 'Wrong Answer',
    6: 'Time Limit Exceeded',
    7: 'Memory Limit Exceeded',
    8: 'Output Limit Exceeded',
    9: 'Presentation Error',
    10: 'System Error',
    11: 'Rejudge Pending'
  }),
  languages: (state) => ({
    1: 'C',
    2: 'C++',
    3: 'Java'
  }),
  defaultLanguage: (state) => state.defaultLanguage
}

const mutations = {
  updateCurrentTime (state, payload) {
    state.currentTime += payload.step
  },
  showLoginModal (state, payload) {
    state.loginModalActive = true
  },
  closeLoginModal (state, payload) {
    state.loginModalActive = false
  },
  updateDefaultLanguage (state, payload) {
    state.defaultLanguage = payload.language
  }
}

const actions = {
  updateCurrentTime ({commit}, payload) {
    setInterval(() => {
      commit('updateCurrentTime', {
        step: 1000
      })
    }, 1000)
  }
}

const store = new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  modules
})

// store.dispatch('updateCurrentTime')
store.dispatch('fetchSession')

export default store
