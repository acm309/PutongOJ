import axios from 'axios'
import queryString from 'query-string'

const state = {
  contestsList: []
}

const getters = {
  contestsList: (state) => {
    return state.contestsList
  }
}

const mutations = {
  updateContestsList (state, payload) {
    state.contestsList = payload.contestsList
  }
}

const actions = {
  fetchContestsList ({commit}, payload) {
    return axios.get('/contests?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateContestsList', {
          contestsList: data.contests
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
