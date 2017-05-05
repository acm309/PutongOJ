import axios from 'axios'
import queryString from 'query-string'

const host = 'http://localhost:3000'

const state = {
  ranklist: [],
  ranklistPagination: {}
}

const getters = {
  ranklist: (state) => {
    return state.ranklist
  },
  ranklistPagination: (state) => {
    return state.ranklistPagination
  }
}

const mutations = {
  updateRanklist (state, payload) {
    state.ranklist = payload.ranklist
  },
  updateRanklistPagination (state, payload) {
    state.ranklistPagination = payload.ranklistPagination
  }
}

const actions = {
  fetchRanklist ({commit}, payload) {
    return axios.get(host + '/api/ranklist?' + queryString.stringify(payload))
      .then(({data}) => {
        commit('updateRanklist', {
          ranklist: data.ranklist
        })
        commit('updateRanklistPagination', {
          ranklistPagination: data.pagination
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
