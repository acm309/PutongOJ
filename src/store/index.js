import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import modules from './modules'

Vue.use(Vuex)

axios.defaults.baseURL = 'http://127.0.0.1:3000/api/'
axios.defaults.withCredentials = true

const state = {
  currentTime: Date.now(),
  loginModalActive: false
}

const getters = {
  currentTime: (state) => state.currentTime,
  loginModalActive: (state) => state.loginModalActive
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

store.dispatch('updateCurrentTime')
store.dispatch('fetchSession')

export default store
