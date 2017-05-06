import axios from 'axios'
import queryString from 'query-string'

const state = {
  contestsList: [],
  contest: null
}

const getters = {
  contestsList: (state) => state.contestsList,
  contest: (state) => state.contest
}

const mutations = {
  updateContestsList (state, payload) {
    state.contestsList = payload.contestsList
  },
  updateContest (state, payload) {
    state.contest = payload.contest
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
  },
  fetchContest ({commit}, payload) {
    return axios.get(`/contests/${payload.cid}`)
      .then(({data}) => {
        commit('updateContest', data)
      })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
