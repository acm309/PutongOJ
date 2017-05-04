import axios from 'axios'
import queryString from 'query-string'

const host = 'http://localhost:3000'

const state = {
  problemsList: []
}

const getters = {
  problemsList: (state) => {
    return state.problemsList
  }
}

const mutations = {
  updateProblemsList (state, payload) {
    state.problemsList = payload.problemsList
  }
}

const actions = {
  fetchProblemsList ({commit}, payload) {
    return axios.get(host + '/api/problems?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateProblemsList', {
          problemsList: data.problems
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
