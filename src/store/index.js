import Vue from 'vue'
import Vuex from 'vuex'
import modules from './modules'

Vue.use(Vuex)

const state = {
  currentTime: Date.now()
}

const getters = {
  currentTime: (state) => state.currentTime
}

const mutations = {
  updateCurrentTime (state, payload) {
    state.currentTime += payload.step
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

export default store
