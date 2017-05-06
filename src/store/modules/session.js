import axios from 'axios'

const state = {
  self: null
}

const getters = {
  self: (state) => state.self,
  logined: (state) => state.self !== null,
  isAdmin: (state, getters) =>
    getters.logined && state.self.privilege === getters.privilege.Admin
}

const mutations = {
  updateSelf (state, payload) {
    state.self = payload.self
  },
  deleteSelf (state, payload) {
    state.self = null
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
  },
  logout ({commit}, payload) {
    return axios.delete('/session')
      .then(({data}) => {
        commit('deleteSelf')
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
