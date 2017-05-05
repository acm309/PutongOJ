import axios from 'axios'

const state = {
  user: {},
  solved: [],
  unsolved: []
}

const getters = {
  user: (state) => state.user,
  solved: (state) => state.solved,
  unsolved: (state) => state.unsolved
}

const mutations = {
  updateUser (state, payload) {
    state.user = payload.user
  },
  updateSolved (state, payload) {
    state.solved = payload.solved
  },
  updateUnsolved (state, payload) {
    state.unsolved = payload.unsolved
  }
}

const actions = {
  fetchUser ({commit}, payload) {
    return axios.get(`/users/${payload.uid}`)
      .then(({data}) => {
        commit('updateUser', data)
        commit('updateSolved', data)
        commit('updateUnsolved', data)
      })
  },
  register ({commit}, payload) {
    return axios.post('/users', payload)
      .then(({data}) => {
        commit('updateSelf', { // session module
          self: data.user
        })
      })
  },
  updateUser ({commit}, payload) {
    return axios.put(`/users/${payload.uid}`, payload)
      .then(({data}) => {
        commit('updateUser', {
          user: data.user
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
