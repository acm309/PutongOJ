import axios from 'axios'

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
    return axios.get(host + '/api/problems')
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
