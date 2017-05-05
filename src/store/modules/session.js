import axios from 'axios'

const host = 'http://localhost:3000'

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
    return axios.post(host + `/api/session`, payload)
      .then(({data}) => {
        commit('updateSelf', {
          self: data.user
        })
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
