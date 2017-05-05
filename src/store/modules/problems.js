import axios from 'axios'
import queryString from 'query-string'

const state = {
  problemsList: [],
  problemsPagination: {}
}

const getters = {
  problemsList: (state) => {
    return state.problemsList
  },
  problemsPagination: (state) => {
    return state.problemsPagination
  }
}

const mutations = {
  updateProblemsList (state, payload) {
    state.problemsList = payload.problemsList
  },
  updateProblemsPagination (state, payload) {
    state.problemsPagination = payload.problemsPagination
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
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
