import axios from 'axios'
import queryString from 'query-string'

const host = 'http://localhost:3000'

const state = {
  problem: {}
}

const getters = {
  problem: (state) => {
    return state.problem
  }
}

const mutations = {
  updateProblem (state, payload) {
    state.problem = payload.problem
  }
}

const actions = {
  fetchProblem ({commit}, payload) {
    return axios.get(host + `/api/problems/${payload.pid}?` + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateProblem', {
          problem: data.problem
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
