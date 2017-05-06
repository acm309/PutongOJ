import axios from 'axios'
import queryString from 'query-string'

const state = {
  contestsList: [],
  contest: null,
  contestOverview: []
}

const getters = {
  contestsList: (state) => state.contestsList,
  contest: (state) => state.contest,
  contestOverview: (state) => state.contestOverview
}

const mutations = {
  updateContestsList (state, payload) {
    state.contestsList = payload.contestsList
  },
  updateContest (state, payload) {
    state.contest = payload.contest
  },
  updateContestOverview (state, payload) {
    state.contestOverview = payload.contestOverview
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
  },
  fetchContestOverview ({commit}, payload) {
    return axios.get(`/contests/${payload.cid}/overview`)
      .then(({data}) => {
        commit('updateContestOverview', {
          contestOverview: data.overview
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
