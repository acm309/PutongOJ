import axios from 'axios'
import queryString from 'query-string'

const state = {
  ranklist: [],
  ranklistPagination: {}
}

const getters = {
  ranklist: (state) => state.ranklist,
  ranklistPagination: (state) => state.ranklistPagination
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
    return axios.get('/ranklist?' + queryString.stringify(payload))
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
