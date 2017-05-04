import axios from 'axios'
import queryString from 'query-string'

const host = 'http://localhost:3000'

const state = {
  ranklist: []
}

const getters = {
  ranklist: (state) => {
    return state.ranklist
  }
}

const mutations = {
  updateRanklist (state, payload) {
    state.ranklist = payload.ranklist
  }
}

const actions = {
  fetchRanklist ({commit}, payload) {
    return axios.get(host + '/api/ranklist?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateRanklist', {
          ranklist: data.ranklist
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
