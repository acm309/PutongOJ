import axios from 'axios'

const state = {
  statistics: null,
  statisticsSolution: []
}

const getters = {
  statistics: (state) => state.statistics,
  statisticsSolution: (state) => state.statisticsSolution
}

const mutations = {
  updateStatistics (state, payload) {
    state.statistics = payload.statistics
  },
  updateStatisticsSolution (state, payload) {
    state.statisticsSolution = payload.statisticsSolution
  }
}

const actions = {
  fetchStatistics ({commit}, payload) {
    return axios.get(`/statistics/${payload.pid}`)
      .then(({data}) => {
        commit('updateStatistics', data)
        commit('updateStatisticsSolution', {
          statisticsSolution: data.solutions
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
