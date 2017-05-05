import axios from 'axios'
import queryString from 'query-string'

const state = {
  solutionsList: [],
  solutionsPagination: {}
}

const getters = {
  solutionsList: (state) => {
    return state.solutionsList
  },
  solutionsPagination: (state) => {
    return state.solutionsPagination
  }
}

const mutations = {
  updateSolutionsList (state, payload) {
    state.solutionsList = payload.solutionsList
  },
  updateSolutionsPagination (state, payload) {
    state.solutionsPagination = payload.solutionsPagination
  }
}

const actions = {
  fetchSolutionsList ({commit}, payload) {
    return axios.get('/status?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateSolutionsList', {
          solutionsList: data.solutions
        })
        commit('updateSolutionsPagination', {
          solutionsPagination: data.pagination
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
