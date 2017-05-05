import axios from 'axios'

const state = {
  self: null
}

const getters = {
  self: (state) => state.self
}

const mutations = {
  updateSelf (state, payload) {
    state.self = payload.self
  }
}

const actions = {
  login ({commit}, payload) {
    return axios.post(`/session`, payload)
      .then(({data}) => {
        commit('updateSelf', {
          self: data.user
        })
      })
  },
  fetchSession ({commit}, payload) {
    return axios.get(`/session`)
      .then(({data}) => {
        if (data.user) {
          commit('updateSelf', {
            self: data.user
          })
        }
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
