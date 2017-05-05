import axios from 'axios'
import queryString from 'query-string'

const state = {
  solutionsList: [],
  solutionsPagination: {},
  solution: {},
  solutionModalActive: false,
  sid: null
}

const getters = {
  solutionsList: (state) => state.solutionsList,
  solutionsPagination: (state) => state.solutionsPagination,
  solution: (state) => state.solution,
  solutionModalActive: (state) => state.solutionModalActive,
  sid: (state) => state.sid
}

const mutations = {
  updateSolutionsList (state, payload) {
    state.solutionsList = payload.solutionsList
  },
  updateSolutionsPagination (state, payload) {
    state.solutionsPagination = payload.solutionsPagination
  },
  updateSolution (state, payload) {
    state.solution = payload.solution
  },
  showSolutionModal (state, payload) {
    state.solutionModalActive = true
    state.sid = payload.sid
  },
  closeSolutionModal (state, payload) {
    state.solutionModalActive = false
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
  },
  fetchSolution ({commit}, payload) {
    return axios.get(`/status/${payload.sid}`)
      .then(({data}) => {
        commit('updateSolution', data)
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
