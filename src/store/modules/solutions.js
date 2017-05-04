import axios from 'axios'
import queryString from 'query-string'

const host = 'http://localhost:3000'

const state = {
  solutionsList: []
}

const getters = {
  solutionsList: (state) => {
    return state.solutionsList
  }
}

const mutations = {
  updateSolutionsList (state, payload) {
    state.solutionsList = payload.solutionsList
  }
}

const actions = {
  fetchSolutionsList ({commit}, payload) {
    return axios.get(host + '/api/status?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateSolutionsList', {
          solutionsList: data.solutions
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
