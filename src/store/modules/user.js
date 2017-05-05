import axios from 'axios'

const host = 'http://localhost:3000'

const state = {
  user: {},
  solved: [],
  unsolved: []
}

const getters = {
  user: (state) => {
    return state.user
  },
  solved: (state) => {
    return state.solved
  },
  unsolved: (state) => {
    return state.unsolved
  }
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
    return axios.get(host + `/api/users/${payload.uid}`)
      .then(({data}) => {
        commit('updateUser', data)
        commit('updateSolved', data)
        commit('updateUnsolved', data)
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
