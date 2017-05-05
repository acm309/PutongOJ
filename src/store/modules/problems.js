import axios from 'axios'
import queryString from 'query-string'

const state = {
  problemsList: [],
  problemsPagination: {},
  problem: {}
}

const getters = {
  problemsList: (state) => state.problemsList,
  problemsPagination: (state) => state.problemsPagination,
  problem: (state) => state.problem
}

const mutations = {
  updateProblemsList (state, payload) {
    state.problemsList = payload.problemsList
  },
  updateProblemsPagination (state, payload) {
    state.problemsPagination = payload.problemsPagination
  },
  updateProblem (state, payload) {
    state.problem = payload.problem
  }
}

const actions = {
  fetchProblemsList ({commit}, payload) {
    return axios.get('/problems?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateProblemsList', {
          problemsList: data.problems
        })
        commit('updateProblemsPagination', {
          problemsPagination: data.pagination
        })
      })
  },
  fetchProblem ({commit}, payload) {
    return axios.get(`/problems/${payload.pid}?` + queryString.stringify(payload))
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
